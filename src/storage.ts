import AsyncStorage from '@react-native-async-storage/async-storage';

import { migratePlant } from './care';
import {
  DEFAULT_WATER_DAYS,
  DEFAULT_WATER_TIME,
  type CopilotState,
  type HomeLayout,
  type Plant,
} from './models';

const STORAGE_KEY = 'jardim-copiloto-v2';
const LEGACY_KEY = 'jardim-copiloto-v1';

export const createInitialState = (): CopilotState => ({
  version: 2,
  plants: [],
  logs: [],
  notificationsEnabled: true,
  onboarded: false,
  darkMode: false,
  homeLayout: 'grid',
  legalAcceptedVersion: null,
  legalAcceptedAt: null,
});

const parseHomeLayout = (value: unknown): HomeLayout =>
  value === 'list' ? 'list' : 'grid';

export const loadState = async (): Promise<CopilotState> => {
  try {
    const raw =
      (await AsyncStorage.getItem(STORAGE_KEY)) ?? (await AsyncStorage.getItem(LEGACY_KEY));
    if (!raw) return createInitialState();
    const parsed = JSON.parse(raw) as Partial<CopilotState> & { plants?: unknown[] };
    if (!Array.isArray(parsed.plants)) return createInitialState();

    const hasLegalField = 'legalAcceptedVersion' in parsed;
    const legalAcceptedVersion =
      typeof parsed.legalAcceptedVersion === 'string' ? parsed.legalAcceptedVersion : null;
    const legalAcceptedAt =
      typeof parsed.legalAcceptedAt === 'number' ? parsed.legalAcceptedAt : null;

    return {
      version: 2,
      plants: parsed.plants.map((p) => migratePlant(p as unknown as Record<string, unknown>)),
      logs: Array.isArray(parsed.logs) ? parsed.logs : [],
      // Novos usuários: alertas ligados. Quem já tinha estado sem o campo legal ainda:
      // se notificationsEnabled estava salvo, respeita; senão default true.
      notificationsEnabled:
        typeof parsed.notificationsEnabled === 'boolean'
          ? parsed.notificationsEnabled
          : true,
      onboarded: Boolean(parsed.onboarded),
      darkMode: Boolean(parsed.darkMode),
      homeLayout: parseHomeLayout(parsed.homeLayout),
      // Instalação antiga sem campo de aceite: pede aceite na próxima abertura
      legalAcceptedVersion: hasLegalField ? legalAcceptedVersion : null,
      legalAcceptedAt: hasLegalField ? legalAcceptedAt : null,
    };
  } catch {
    return createInitialState();
  }
};

export const saveState = async (state: CopilotState): Promise<void> => {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ ...state, version: 2 }));
};

export const clearState = async (): Promise<void> => {
  await AsyncStorage.multiRemove([STORAGE_KEY, LEGACY_KEY]);
};

export const defaultNewPlantFields = () => ({
  waterDays: [...DEFAULT_WATER_DAYS] as Plant['waterDays'],
  waterTime: DEFAULT_WATER_TIME,
  fertilizeDueAt: null as number | null,
  fertilizeNote: '',
  imageUri: null as string | null,
});
