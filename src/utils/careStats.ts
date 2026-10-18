import { startOfDay, DAY_MS } from '../care';
import type { CareLog, CareUrgency } from '../models';

export type DayBar = {
  key: string;
  label: string;
  count: number;
  isToday: boolean;
};

const DAY_SHORT = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

/** Atividade dos últimos 7 dias (hoje à direita). */
export const buildWeekActivity = (logs: CareLog[], now = Date.now()): DayBar[] => {
  const today = startOfDay(now);
  const bars: DayBar[] = [];

  for (let i = 6; i >= 0; i -= 1) {
    const dayStart = today - i * DAY_MS;
    const dayEnd = dayStart + DAY_MS;
    const d = new Date(dayStart);
    const count = logs.filter((l) => l.at >= dayStart && l.at < dayEnd).length;
    bars.push({
      key: String(dayStart),
      label: DAY_SHORT[d.getDay()]!,
      count,
      isToday: i === 0,
    });
  }
  return bars;
};

export const waterProgress = (
  urgency: CareUrgency,
  daysUntil: number,
): { progress: number; label: string; tone: 'ok' | 'warn' | 'bad' | 'good' } => {
  if (urgency === 'overdue') {
    return { progress: 0.08, label: 'Atrasada', tone: 'bad' };
  }
  if (urgency === 'due') {
    return { progress: 0.22, label: 'Hoje', tone: 'warn' };
  }
  if (urgency === 'soon') {
    return { progress: 0.45, label: 'Amanhã', tone: 'warn' };
  }
  const capped = Math.min(7, Math.max(0, daysUntil));
  const progress = 0.55 + (capped / 7) * 0.4;
  return {
    progress,
    label: daysUntil <= 0 ? 'Em dia' : `${daysUntil}d`,
    tone: 'good',
  };
};

export const daysUntilDue = (dueAt: number, now = Date.now()): number =>
  Math.round((startOfDay(dueAt) - startOfDay(now)) / DAY_MS);

export const formatShortDate = (ts: number | null): string => {
  if (ts == null) return '—';
  return new Date(ts).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
};
