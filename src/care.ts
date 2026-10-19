import {
  DEFAULT_WATER_DAYS,
  DEFAULT_WATER_TIME,
  WEEKDAY_LABELS,
  type CareAlert,
  type CareKind,
  type CareUrgency,
  type Plant,
  type Weekday,
} from './models';

export const DAY_MS = 24 * 60 * 60 * 1000;

export const startOfDay = (ts = Date.now()): number => {
  const d = new Date(ts);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
};

export const addDays = (ts: number, days: number): number => ts + days * DAY_MS;

export const daysBetween = (from: number, to: number): number =>
  Math.floor((to - from) / DAY_MS);

export const parseWaterTime = (time: string): { hour: number; minute: number } => {
  const match = /^(\d{1,2}):(\d{2})$/.exec(time.trim());
  if (!match) return { hour: 9, minute: 0 };
  const hour = Math.min(23, Math.max(0, Number(match[1])));
  const minute = Math.min(59, Math.max(0, Number(match[2])));
  return { hour, minute };
};

export const normalizeWeekDays = (
  days: unknown,
  fallback: Weekday[] = DEFAULT_WATER_DAYS,
): Weekday[] => {
  if (!Array.isArray(days)) return [...fallback];
  const unique = [
    ...new Set(
      days
        .map((d) => Number(d))
        .filter((d) => Number.isInteger(d) && d >= 0 && d <= 6) as Weekday[],
    ),
  ].sort((a, b) => a - b);
  return unique.length > 0 ? unique : [...fallback];
};

export const normalizeWaterDays = (days: unknown): Weekday[] =>
  normalizeWeekDays(days, DEFAULT_WATER_DAYS);

export const formatWaterDays = (days: Weekday[]): string => {
  const sorted = [...days].sort((a, b) => a - b);
  if (sorted.length === 0) return 'nenhum dia';
  if (sorted.length === 7) return 'todos os dias';
  return sorted.map((d) => WEEKDAY_LABELS[d]!.short).join(', ');
};

export const formatWaterSchedule = (plant: Plant): string =>
  `${formatWaterDays(plant.waterDays)} · ${plant.waterTime || DEFAULT_WATER_TIME}`;

export const formatFertilizeSchedule = (plant: Plant): string => {
  if (plant.fertilizeDueAt == null) return 'Sem adubação agendada';
  return new Date(plant.fertilizeDueAt).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

export const wasDoneToday = (lastAt: number | null, now = Date.now()): boolean => {
  if (lastAt == null) return false;
  return startOfDay(lastAt) === startOfDay(now);
};

/** "Reguei" só depois de regar hoje; senão "Regar". */
export const waterActionLabel = (plant: Plant, now = Date.now()): string =>
  wasDoneToday(plant.lastWateredAt, now) ? 'Reguei' : 'Regar';

export const nextWeeklyDueAt = (
  weekDays: Weekday[],
  time: string,
  now = Date.now(),
): number => {
  const days = weekDays.length > 0 ? weekDays : DEFAULT_WATER_DAYS;
  const { hour, minute } = parseWaterTime(time || DEFAULT_WATER_TIME);
  const nowDate = new Date(now);

  for (let offset = 0; offset < 8; offset += 1) {
    const candidate = new Date(now);
    candidate.setHours(0, 0, 0, 0);
    candidate.setDate(candidate.getDate() + offset);
    if (!days.includes(candidate.getDay() as Weekday)) continue;
    candidate.setHours(hour, minute, 0, 0);
    if (offset === 0 && candidate.getTime() < nowDate.getTime()) continue;
    return candidate.getTime();
  }

  const fallback = new Date(now);
  fallback.setDate(fallback.getDate() + 1);
  fallback.setHours(hour, minute, 0, 0);
  return fallback.getTime();
};

export const getUrgency = (dueAt: number, now = Date.now()): CareUrgency => {
  const today = startOfDay(now);
  const dueDay = startOfDay(dueAt);
  const diff = daysBetween(today, dueDay);

  if (diff < 0) return 'overdue';
  if (diff === 0) return 'due';
  if (diff <= 1) return 'soon';
  return 'ok';
};

export const buildWaterAlert = (plant: Plant, now = Date.now()): CareAlert => {
  const days = normalizeWaterDays(plant.waterDays);
  const todayWeekday = new Date(now).getDay() as Weekday;
  const isToday = days.includes(todayWeekday);
  const doneToday = wasDoneToday(plant.lastWateredAt, now);
  const time = plant.waterTime || DEFAULT_WATER_TIME;
  const { hour, minute } = parseWaterTime(time);

  const todayDue = new Date(now);
  todayDue.setHours(hour, minute, 0, 0);

  let urgency: CareUrgency = 'ok';
  let dueAt = nextWeeklyDueAt(days, time, now);

  if (isToday && !doneToday) {
    dueAt = todayDue.getTime();
    urgency = now >= todayDue.getTime() ? 'overdue' : 'due';
  } else if (!isToday) {
    urgency = getUrgency(dueAt, now);
  }

  return {
    id: `${plant.id}-water`,
    plantId: plant.id,
    plantName: plant.name,
    speciesId: plant.speciesId,
    imageUri: plant.imageUri,
    kind: 'water',
    urgency,
    dueAt,
    daysLate: urgency === 'overdue' ? Math.max(0, daysBetween(startOfDay(dueAt), startOfDay(now))) : 0,
  };
};

export const buildFertilizeAlert = (plant: Plant, now = Date.now()): CareAlert | null => {
  if (plant.fertilizeDueAt == null) return null;
  const dueAt = plant.fertilizeDueAt;
  const urgency = getUrgency(dueAt, now);
  const daysLate = Math.max(0, daysBetween(startOfDay(dueAt), startOfDay(now)));
  return {
    id: `${plant.id}-fertilize`,
    plantId: plant.id,
    plantName: plant.name,
    speciesId: plant.speciesId,
    imageUri: plant.imageUri,
    kind: 'fertilize',
    urgency,
    dueAt,
    daysLate,
  };
};

export const buildAlert = (plant: Plant, kind: CareKind, now = Date.now()): CareAlert => {
  if (kind === 'water') return buildWaterAlert(plant, now);
  return (
    buildFertilizeAlert(plant, now) ?? {
      id: `${plant.id}-fertilize`,
      plantId: plant.id,
      plantName: plant.name,
      speciesId: plant.speciesId,
      imageUri: plant.imageUri,
      kind: 'fertilize',
      urgency: 'ok',
      dueAt: now,
      daysLate: 0,
    }
  );
};

export const collectAlerts = (plants: Plant[], now = Date.now()): CareAlert[] => {
  const alerts: CareAlert[] = [];
  for (const plant of plants) {
    alerts.push(buildWaterAlert(plant, now));
    const fert = buildFertilizeAlert(plant, now);
    if (fert) alerts.push(fert);
  }

  const rank: Record<CareUrgency, number> = {
    overdue: 0,
    due: 1,
    soon: 2,
    ok: 3,
  };

  return alerts
    .filter((a) => a.urgency !== 'ok')
    .sort((a, b) => rank[a.urgency] - rank[b.urgency] || a.dueAt - b.dueAt);
};

export const urgencyLabel = (urgency: CareUrgency): string => {
  switch (urgency) {
    case 'overdue':
      return 'Atrasado';
    case 'due':
      return 'Hoje';
    case 'soon':
      return 'Amanhã';
    default:
      return 'Em dia';
  }
};

export const formatRelativeDue = (dueAt: number, now = Date.now()): string => {
  const diff = daysBetween(startOfDay(now), startOfDay(dueAt));
  if (diff === 0) return 'hoje';
  if (diff === 1) return 'amanhã';
  if (diff === -1) return 'ontem';
  if (diff < 0) return `há ${Math.abs(diff)} dia${Math.abs(diff) === 1 ? '' : 's'}`;
  return `em ${diff} dia${diff === 1 ? '' : 's'}`;
};

export const formatWaterDueLabel = (alert: CareAlert, now = Date.now()): string => {
  const isFertilize = alert.kind === 'fertilize';
  const prefix = isFertilize ? 'Adubo' : 'Rega';
  if (alert.urgency === 'overdue') {
    const days = Math.max(1, alert.daysLate);
    const unit = days === 1 ? 'dia' : 'dias';
    return `${prefix} atrasad${isFertilize ? 'o' : 'a'} ${days} ${unit}`;
  }
  if (alert.urgency === 'due') return `${prefix} hoje`;
  const diff = daysBetween(startOfDay(now), startOfDay(alert.dueAt));
  if (diff <= 1) return `${prefix} amanhã`;
  return `${prefix} em ${diff} dias`;
};

export const formatTimeBr = (ts: number): string =>
  new Date(ts).toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

export const formatDateTime = (ts: number): string => {
  const d = new Date(ts);
  const date = d.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
  });
  return `${date}, ${formatTimeBr(ts)}`;
};

export const createId = (): string =>
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

/** Migra plantas antigas para agenda semanal + adubo por data */
export const migratePlant = (raw: Record<string, unknown>): Plant => {
  const speciesId = typeof raw.speciesId === 'string' ? raw.speciesId : 'broto';
  const waterDays = Array.isArray(raw.waterDays)
    ? normalizeWaterDays(raw.waterDays)
    : [...DEFAULT_WATER_DAYS];

  let fertilizeDueAt: number | null = null;
  if (typeof raw.fertilizeDueAt === 'number') {
    fertilizeDueAt = raw.fertilizeDueAt;
  } else if (typeof raw.fertilizeEveryDays === 'number' && raw.fertilizeEveryDays > 0) {
    const base =
      typeof raw.lastFertilizedAt === 'number'
        ? raw.lastFertilizedAt
        : typeof raw.createdAt === 'number'
          ? raw.createdAt
          : Date.now();
    fertilizeDueAt = addDays(base, Math.max(1, raw.fertilizeEveryDays));
  } else if (raw.fertilizeEnabled === true) {
    fertilizeDueAt = addDays(Date.now(), 30);
  }

  let notes: string[] = [];
  if (Array.isArray(raw.notes)) {
    notes = raw.notes
      .filter((n): n is string => typeof n === 'string')
      .map((n) => n.trim())
      .filter(Boolean);
  } else if (typeof raw.notes === 'string' && raw.notes.trim()) {
    notes = [raw.notes.trim()];
  }

  return {
    id: typeof raw.id === 'string' ? raw.id : createId(),
    name: typeof raw.name === 'string' ? raw.name : 'Planta',
    speciesId,
    location: typeof raw.location === 'string' ? raw.location : '',
    notes,
    waterDays,
    waterTime:
      typeof raw.waterTime === 'string' && raw.waterTime.trim()
        ? raw.waterTime
        : DEFAULT_WATER_TIME,
    fertilizeDueAt,
    fertilizeNote: typeof raw.fertilizeNote === 'string' ? raw.fertilizeNote.trim() : '',
    imageUri: typeof raw.imageUri === 'string' ? raw.imageUri : null,
    lastWateredAt: typeof raw.lastWateredAt === 'number' ? raw.lastWateredAt : null,
    lastFertilizedAt: typeof raw.lastFertilizedAt === 'number' ? raw.lastFertilizedAt : null,
    createdAt: typeof raw.createdAt === 'number' ? raw.createdAt : Date.now(),
  };
};
