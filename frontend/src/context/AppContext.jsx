import { useEffect, useState } from 'react';
import { AppContext } from './app-context';
import {
  addDays,
  createEmptyState,
  createId,
  elapsedMinutes,
  loadState,
  localDate,
  normaliseState,
  saveState,
  TASK_STATUS,
} from '../lib/storage';

const roundMoney = (value) => Math.round((Number(value) + Number.EPSILON) * 100) / 100;

function stopRunningTask(task, now = Date.now()) {
  if (task.status !== TASK_STATUS.ACTIVE) return task;
  return {
    ...task,
    actualMinutes: elapsedMinutes(task, now),
    startedAt: null,
    updatedAt: new Date(now).toISOString(),
  };
}

export function AppProvider({ children }) {
  const [state, setState] = useState(loadState);
  const [storageError, setStorageError] = useState('');

  useEffect(() => {
    try {
      saveState(state);
      setStorageError('');
    } catch (error) {
      console.error(error);
      setStorageError('Browser storage is full or unavailable. Export a backup before continuing.');
    }
  }, [state]);

  const addTask = (input) => {
    const title = input.title?.trim();
    if (!title) throw new Error('Task title is required.');
    const now = new Date().toISOString();
    const task = {
      id: createId('task'),
      title,
      description: input.description?.trim() ?? '',
      client: input.client?.trim() ?? '',
      externalId: input.externalId?.trim() ?? '',
      source: 'MANUAL',
      status: TASK_STATUS.INBOX,
      estimatedMinutes: Math.max(0, Number(input.estimatedMinutes) || 0),
      actualMinutes: 0,
      startedAt: null,
      completedAt: null,
      invoiceId: null,
      comment: '',
      createdAt: now,
      updatedAt: now,
    };
    setState((current) => ({ ...current, tasks: [task, ...current.tasks] }));
    return task;
  };

  const updateTask = (id, patch) => {
    setState((current) => ({
      ...current,
      tasks: current.tasks.map((task) => task.id === id
        ? { ...task, ...patch, id: task.id, updatedAt: new Date().toISOString() }
        : task),
    }));
  };

  const deleteTask = (id) => {
    setState((current) => ({
      ...current,
      tasks: current.tasks.filter((task) => task.id !== id || task.status === TASK_STATUS.INVOICED),
    }));
  };

  const moveTask = (id, status) => {
    if (!Object.values(TASK_STATUS).includes(status)) return;
    const now = Date.now();
    setState((current) => ({
      ...current,
      tasks: current.tasks.map((task) => {
        if (task.id !== id) return task;
        const stopped = stopRunningTask(task, now);
        return {
          ...stopped,
          status,
          startedAt: null,
          updatedAt: new Date(now).toISOString(),
        };
      }),
    }));
  };

  const startTask = (id) => {
    const now = Date.now();
    setState((current) => ({
      ...current,
      tasks: current.tasks.map((task) => {
        if (task.id === id) {
          return {
            ...task,
            status: TASK_STATUS.ACTIVE,
            startedAt: new Date(now).toISOString(),
            updatedAt: new Date(now).toISOString(),
          };
        }
        if (task.status === TASK_STATUS.ACTIVE) {
          return { ...stopRunningTask(task, now), status: TASK_STATUS.TODAY };
        }
        return task;
      }),
    }));
  };

  const pauseTask = (id) => {
    const now = Date.now();
    setState((current) => ({
      ...current,
      tasks: current.tasks.map((task) => task.id === id
        ? { ...stopRunningTask(task, now), status: TASK_STATUS.TODAY }
        : task),
    }));
  };

  const completeTask = (id, { totalMinutes, comment = '' } = {}) => {
    const now = Date.now();
    setState((current) => ({
      ...current,
      tasks: current.tasks.map((task) => {
        if (task.id !== id) return task;
        const tracked = elapsedMinutes(task, now);
        const requested = Number(totalMinutes);
        return {
          ...task,
          status: TASK_STATUS.COMPLETED,
          actualMinutes: Number.isFinite(requested) && requested >= 0 ? requested : tracked,
          startedAt: null,
          completedAt: new Date(now).toISOString(),
          comment: comment.trim(),
          updatedAt: new Date(now).toISOString(),
        };
      }),
    }));
  };

  const createInvoice = (taskIds) => {
    const selected = state.tasks.filter((task) => taskIds.includes(task.id) && task.status === TASK_STATUS.COMPLETED);
    if (!selected.length) throw new Error('Select at least one completed task.');

    const namedClients = [...new Set(selected.map((task) => task.client.trim()).filter(Boolean))];
    if (namedClients.length > 1) throw new Error('Create separate invoices for different clients.');

    const settings = state.settings;
    const nextNumber = Number(settings.nextInvoiceNumber) || 1;
    const prefix = String(settings.invoicePrefix || 'INV').trim().toUpperCase();
    const number = `${prefix}-${String(nextNumber).padStart(4, '0')}`;
    const createdAt = new Date();
    const rate = Math.max(0, Number(settings.hourlyRate) || 0);
    const taxRate = Math.max(0, Number(settings.taxRate) || 0);

    const lines = selected.map((task) => {
      const hours = Math.round((Number(task.actualMinutes) / 60) * 100) / 100;
      return {
        taskId: task.id,
        date: localDate(task.completedAt || task.updatedAt || createdAt),
        reference: task.externalId || task.id.slice(-8).toUpperCase(),
        description: [task.title, task.comment].filter(Boolean).join(' — '),
        hours,
        rate,
        amount: roundMoney(hours * rate),
      };
    });
    const subtotal = roundMoney(lines.reduce((sum, line) => sum + line.amount, 0));
    const taxAmount = roundMoney(subtotal * taxRate / 100);
    const total = roundMoney(subtotal + taxAmount);
    const invoice = {
      id: createId('invoice'),
      number,
      issueDate: localDate(createdAt),
      dueDate: localDate(addDays(createdAt, settings.paymentTermsDays)),
      currency: settings.currency || 'EUR',
      seller: {
        name: settings.sellerName,
        registration: settings.sellerRegistration,
        address: settings.sellerAddress,
        email: settings.sellerEmail,
        phone: settings.sellerPhone,
        bank: settings.sellerBank,
        iban: settings.sellerIban,
        swift: settings.sellerSwift,
      },
      buyer: {
        name: namedClients[0] || settings.clientName,
        registration: settings.clientRegistration,
        address: settings.clientAddress,
        email: settings.clientEmail,
      },
      lines,
      subtotal,
      taxRate,
      taxAmount,
      total,
      notes: settings.invoiceNotes,
      createdAt: createdAt.toISOString(),
    };

    setState((current) => ({
      ...current,
      tasks: current.tasks.map((task) => taskIds.includes(task.id)
        ? {
          ...task,
          status: TASK_STATUS.INVOICED,
          invoiceId: invoice.id,
          invoicedAt: createdAt.toISOString(),
          updatedAt: createdAt.toISOString(),
        }
        : task),
      invoices: [invoice, ...current.invoices],
      settings: { ...current.settings, nextInvoiceNumber: nextNumber + 1 },
    }));

    return invoice;
  };

  const deleteInvoice = (invoiceId) => {
    setState((current) => ({
      ...current,
      invoices: current.invoices.filter((invoice) => invoice.id !== invoiceId),
      tasks: current.tasks.map((task) => task.invoiceId === invoiceId
        ? {
          ...task,
          status: TASK_STATUS.COMPLETED,
          invoiceId: null,
          invoicedAt: null,
          updatedAt: new Date().toISOString(),
        }
        : task),
    }));
  };

  const saveSettings = (settings) => {
    setState((current) => normaliseState({
      ...current,
      settings: { ...current.settings, ...settings },
    }));
  };

  const restoreState = (restored) => setState(normaliseState(restored));
  const resetWorkspace = () => setState(createEmptyState());

  const value = {
    state,
    storageError,
    addTask,
    updateTask,
    deleteTask,
    moveTask,
    startTask,
    pauseTask,
    completeTask,
    createInvoice,
    deleteInvoice,
    saveSettings,
    restoreState,
    resetWorkspace,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}
