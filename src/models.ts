export type CareActionType =
  | 'water'
  | 'fertilize'
  | 'repot'
  | 'pest'
  | 'prune'
  | 'other';

export type CareUrgency = 'overdue' | 'due' | 'soon' | 'ok';
export type CareKind = 'water' | 'fertilize';

/** 0 = domingo … 6 = sábado (igual Date.getDay()) */
export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export interface CareLog {
  id: string;
  plantId: string;
  type: CareActionType;
  note: string;
  at: number;
}

export interface Plant {
  id: string;
  name: string;
  speciesId: string;
  location: string;
  /** Notas avulsas da planta (podem ser várias) */
  notes: string[];
  /** Dias da semana para regar (0=dom … 6=sáb) */
  waterDays: Weekday[];
  /** Horário da notificação de rega, "HH:mm" */
  waterTime: string;
  /** Data/hora da próxima adubação; null = sem agenda */
  fertilizeDueAt: number | null;
  /** Qual adubo usar / observação da adubação agendada */
  fertilizeNote: string;
  imageUri: string | null;
  lastWateredAt: number | null;
  lastFertilizedAt: number | null;
  createdAt: number;
}

export type HomeLayout = 'grid' | 'list';

/** Plantinha fixa da casa. Não entra na lista de plantas cadastradas. */
export interface Companion {
  lastWateredAt: number | null;
}

export const COMPANION_NAME = 'Broto';

export const defaultCompanion = (): Companion => ({ lastWateredAt: null });

export interface CopilotState {
  version: 2;
  plants: Plant[];
  companion: Companion;
  logs: CareLog[];
  notificationsEnabled: boolean;
  onboarded: boolean;
  darkMode: boolean;
  /** Layout da home: grade (padrão) ou lista */
  homeLayout: HomeLayout;
  /** Versão das políticas aceitas; null = ainda não aceitou */
  legalAcceptedVersion: string | null;
  /** Timestamp do aceite */
  legalAcceptedAt: number | null;
}

export interface CareAlert {
  id: string;
  plantId: string;
  plantName: string;
  speciesId: string;
  imageUri: string | null;
  kind: CareKind;
  urgency: CareUrgency;
  dueAt: number;
  daysLate: number;
}

export interface SpeciesOption {
  id: string;
  label: string;
  defaultWaterDays: number;
  defaultFertilizeDays: number;
  tip: string;
}

export const WEEKDAY_LABELS: { value: Weekday; short: string; full: string }[] = [
  { value: 0, short: 'Dom', full: 'Domingo' },
  { value: 1, short: 'Seg', full: 'Segunda' },
  { value: 2, short: 'Ter', full: 'Terça' },
  { value: 3, short: 'Qua', full: 'Quarta' },
  { value: 4, short: 'Qui', full: 'Quinta' },
  { value: 5, short: 'Sex', full: 'Sexta' },
  { value: 6, short: 'Sáb', full: 'Sábado' },
];

export const DEFAULT_WATER_DAYS: Weekday[] = [1, 3, 5];
export const DEFAULT_WATER_TIME = '09:00';

export const CARE_ACTION_LABELS: Record<CareActionType, string> = {
  water: 'Rega',
  fertilize: 'Adubação',
  repot: 'Troca de vaso',
  pest: 'Defensivo / pragas',
  prune: 'Poda',
  other: 'Outro cuidado',
};

export const CARE_ACTION_HINTS: Record<CareActionType, string> = {
  water: 'Registrou água no substrato',
  fertilize: 'Nutrientes aplicados',
  repot: 'Mudou de vaso ou substrato',
  pest: 'Tratamento contra pragas/fungos',
  prune: 'Cortou folhas ou galhos',
  other: 'Qualquer outro procedimento',
};
