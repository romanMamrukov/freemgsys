export const STORAGE_KEY = 'freemgsys:v2';
export const SCHEMA_VERSION = 2;

export const TASK_STATUS = Object.freeze({
  INBOX: 'INBOX',
  TODAY: 'TODAY',
  ACTIVE: 'ACTIVE',
  COMPLETED: 'COMPLETED',
  INVOICED: 'INVOICED',
});

export const defaultSettings = Object.freeze({
  sellerName: '',
  sellerRegistration: '',
  sellerAddress: '',
  sellerEmail: '',
  sellerPhone: '',
  sellerBank: '',
  sellerIban: '',
  sellerSwift: '',
  clientName: '',
  clientRegistration: '',
  clientAddress: '',
  clientEmail: '',
  hourlyRate: 50,
  currency: 'EUR',
  taxRate: 0,
  paymentTermsDays: 14,
  invoicePrefix: 'INV',
  nextInvoiceNumber: 1,
  invoiceNotes: '',
});

export function createId(prefix = 'item') {
  const value = globalThis.crypto?.randomUUID?.()
    ?? `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
  return `${prefix}-${value}`;
}

export function createEmptyState() {
  return {
    schemaVersion: SCHEMA_VERSION,
    tasks: [],
    invoices: [],
    settings: { ...defaultSettings },
    updatedAt: new Date().toISOString(),
  };
}

function finiteNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

export function normaliseState(value) {
  if (!value || typeof value !== 'object') return createEmptyState();

  const tasks = Array.isArray(value.tasks)
    ? value.tasks
      .filter((task) => task && typeof task === 'object' && task.id && task.title)
      .map((task) => ({
        ...task,
        status: Object.values(TASK_STATUS).includes(task.status)
          ? task.status
          : TASK_STATUS.INBOX,
        estimatedMinutes: Math.max(0, finiteNumber(task.estimatedMinutes, 60)),
        actualMinutes: Math.max(0, finiteNumber(task.actualMinutes, 0)),
      }))
    : [];

  const invoices = Array.isArray(value.invoices)
    ? value.invoices.filter((invoice) => invoice && invoice.id && Array.isArray(invoice.lines))
    : [];

  return {
    schemaVersion: SCHEMA_VERSION,
    tasks,
    invoices,
    settings: {
      ...defaultSettings,
      ...(value.settings && typeof value.settings === 'object' ? value.settings : {}),
      hourlyRate: Math.max(0, finiteNumber(value.settings?.hourlyRate, defaultSettings.hourlyRate)),
      taxRate: Math.max(0, finiteNumber(value.settings?.taxRate, defaultSettings.taxRate)),
      paymentTermsDays: Math.max(0, finiteNumber(value.settings?.paymentTermsDays, defaultSettings.paymentTermsDays)),
      nextInvoiceNumber: Math.max(1, Math.trunc(finiteNumber(value.settings?.nextInvoiceNumber, 1))),
    },
    updatedAt: value.updatedAt || new Date().toISOString(),
  };
}

export function loadState() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? normaliseState(JSON.parse(raw)) : createEmptyState();
  } catch (error) {
    console.warn('Unable to read browser data. Starting with an empty workspace.', error);
    return createEmptyState();
  }
}

export function saveState(state) {
  const next = normaliseState({ ...state, updatedAt: new Date().toISOString() });
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  return next;
}

export function createBackup(state) {
  return JSON.stringify({
    application: 'Freelance IT Ops Console',
    exportedAt: new Date().toISOString(),
    schemaVersion: SCHEMA_VERSION,
    data: normaliseState(state),
  }, null, 2);
}

export function parseBackup(raw) {
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error('The selected file is not valid JSON.');
  }

  const data = parsed?.data ?? parsed;
  if (!data || !Array.isArray(data.tasks) || !Array.isArray(data.invoices)) {
    throw new Error('This file is not a Freelance IT Ops Console backup.');
  }

  return normaliseState(data);
}

export function elapsedMinutes(task, now = Date.now()) {
  const stored = Math.max(0, finiteNumber(task?.actualMinutes, 0));
  if (task?.status !== TASK_STATUS.ACTIVE || !task.startedAt) return stored;

  const started = new Date(task.startedAt).getTime();
  if (!Number.isFinite(started)) return stored;
  return stored + Math.max(0, now - started) / 60000;
}

export function addDays(date, days) {
  const result = new Date(date);
  result.setDate(result.getDate() + Number(days || 0));
  return result;
}

export function localDate(value = new Date()) {
  const date = value instanceof Date ? value : new Date(value);
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-');
}
