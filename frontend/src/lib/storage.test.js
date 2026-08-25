import { describe, expect, it } from 'vitest';
import {
  createBackup,
  createEmptyState,
  elapsedMinutes,
  normaliseState,
  parseBackup,
  TASK_STATUS,
} from './storage';

describe('browser data model', () => {
  it('creates a valid empty state', () => {
    const state = createEmptyState();
    expect(state.tasks).toEqual([]);
    expect(state.invoices).toEqual([]);
    expect(state.settings.hourlyRate).toBe(50);
  });

  it('normalises invalid numeric settings and task values', () => {
    const state = normaliseState({
      tasks: [{ id: '1', title: 'Task', status: 'UNKNOWN', actualMinutes: -3 }],
      invoices: [],
      settings: { hourlyRate: 'invalid', nextInvoiceNumber: 0 },
    });
    expect(state.tasks[0].status).toBe(TASK_STATUS.INBOX);
    expect(state.tasks[0].actualMinutes).toBe(0);
    expect(state.settings.hourlyRate).toBe(50);
    expect(state.settings.nextInvoiceNumber).toBe(1);
  });

  it('round-trips a backup', () => {
    const original = createEmptyState();
    original.tasks.push({ id: 't1', title: 'Test', status: TASK_STATUS.TODAY });
    const restored = parseBackup(createBackup(original));
    expect(restored.tasks[0].title).toBe('Test');
  });

  it('includes a running timer in elapsed minutes', () => {
    const task = {
      status: TASK_STATUS.ACTIVE,
      actualMinutes: 10,
      startedAt: '2026-08-25T10:00:00.000Z',
    };
    expect(elapsedMinutes(task, Date.parse('2026-08-25T10:30:00.000Z'))).toBe(40);
  });
});
