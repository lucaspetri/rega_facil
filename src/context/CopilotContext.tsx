import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import { collectAlerts, createId, normalizeWaterDays } from '../care';
import {
  DEFAULT_WATER_TIME,
  type CareActionType,
  type CareLog,
  type CopilotState,
  type HomeLayout,
  type Plant,
  type Weekday,
} from '../models';
import { syncPlantWaterNotifications } from '../notifications';
import { getSpecies } from '../species';
import { clearState, createInitialState, loadState, saveState } from '../storage';

export type NewPlantInput = {
  name: string;
  speciesId: string;
  location: string;
  notes: string[];
  waterDays: Weekday[];
  waterTime: string;
  fertilizeDueAt: number | null;
  fertilizeNote: string;
  imageUri: string | null;
};

type CopilotContextValue = {
  ready: boolean;
  state: CopilotState;
  alerts: ReturnType<typeof collectAlerts>;
  getPlant: (id: string) => Plant | undefined;
  getLogsForPlant: (plantId: string) => CareLog[];
  addPlant: (input: NewPlantInput) => Plant;
  updatePlant: (id: string, patch: Partial<Plant>) => void;
  removePlant: (id: string) => void;
  logCare: (plantId: string, type: CareActionType, note?: string) => void;
  setNotificationsEnabled: (enabled: boolean) => void;
  setDarkMode: (enabled: boolean) => void;
  setHomeLayout: (layout: HomeLayout) => void;
  acceptLegal: (version: string) => void;
  completeOnboarding: () => void;
  resetDemo: () => Promise<void>;
};

const CopilotContext = createContext<CopilotContextValue | null>(null);

const normalizeNotes = (notes: string[]): string[] =>
  notes.map((n) => n.trim()).filter(Boolean);

export const CopilotProvider = ({ children }: { children: ReactNode }) => {
  const [ready, setReady] = useState(false);
  const [state, setState] = useState<CopilotState>(createInitialState);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const loaded = await loadState();
      if (mounted) {
        setState(loaded);
        setReady(true);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!ready) return;
    void saveState(state);
  }, [ready, state]);

  const alerts = useMemo(() => collectAlerts(state.plants), [state.plants]);

  useEffect(() => {
    if (!ready) return;
    if (!state.legalAcceptedVersion) return;
    void syncPlantWaterNotifications(state.notificationsEnabled, state.plants);
  }, [ready, state.notificationsEnabled, state.plants, state.legalAcceptedVersion]);

  const getPlant = useCallback(
    (id: string) => state.plants.find((p) => p.id === id),
    [state.plants],
  );

  const getLogsForPlant = useCallback(
    (plantId: string) =>
      state.logs.filter((l) => l.plantId === plantId).sort((a, b) => b.at - a.at),
    [state.logs],
  );

  const addPlant = useCallback((input: NewPlantInput): Plant => {
    const species = getSpecies(input.speciesId);
    const now = Date.now();
    const plant: Plant = {
      id: createId(),
      name: input.name.trim() || species.label,
      speciesId: input.speciesId,
      location: input.location.trim(),
      notes: normalizeNotes(input.notes),
      waterDays: normalizeWaterDays(input.waterDays),
      waterTime: input.waterTime.trim() || DEFAULT_WATER_TIME,
      fertilizeDueAt: input.fertilizeDueAt,
      fertilizeNote: input.fertilizeNote.trim(),
      imageUri: input.imageUri,
      lastWateredAt: now,
      lastFertilizedAt: null,
      createdAt: now,
    };
    setState((prev) => ({ ...prev, plants: [plant, ...prev.plants] }));
    return plant;
  }, []);

  const updatePlant = useCallback((id: string, patch: Partial<Plant>) => {
    setState((prev) => ({
      ...prev,
      plants: prev.plants.map((p) => {
        if (p.id !== id) return p;
        const next = { ...p, ...patch };
        if (patch.waterDays) next.waterDays = normalizeWaterDays(patch.waterDays);
        if (patch.notes) next.notes = normalizeNotes(patch.notes);
        if (typeof patch.fertilizeNote === 'string') {
          next.fertilizeNote = patch.fertilizeNote.trim();
        }
        return next;
      }),
    }));
  }, []);

  const removePlant = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      plants: prev.plants.filter((p) => p.id !== id),
      logs: prev.logs.filter((l) => l.plantId !== id),
    }));
  }, []);

  const logCare = useCallback((plantId: string, type: CareActionType, note = '') => {
    const now = Date.now();
    const entry: CareLog = {
      id: createId(),
      plantId,
      type,
      note: note.trim(),
      at: now,
    };
    setState((prev) => ({
      ...prev,
      logs: [entry, ...prev.logs].slice(0, 400),
      plants: prev.plants.map((p) => {
        if (p.id !== plantId) return p;
        if (type === 'water') return { ...p, lastWateredAt: now };
        if (type === 'fertilize') {
          return { ...p, lastFertilizedAt: now, fertilizeDueAt: null, fertilizeNote: '' };
        }
        return p;
      }),
    }));
  }, []);

  const setNotificationsEnabled = useCallback((enabled: boolean) => {
    setState((prev) => ({ ...prev, notificationsEnabled: enabled }));
    if (!enabled) {
      void syncPlantWaterNotifications(false, []);
    }
  }, []);

  const setDarkMode = useCallback((enabled: boolean) => {
    setState((prev) => ({ ...prev, darkMode: enabled }));
  }, []);

  const setHomeLayout = useCallback((layout: HomeLayout) => {
    setState((prev) => ({ ...prev, homeLayout: layout }));
  }, []);

  const acceptLegal = useCallback((version: string) => {
    setState((prev) => ({
      ...prev,
      legalAcceptedVersion: version,
      legalAcceptedAt: Date.now(),
      onboarded: true,
      notificationsEnabled: true,
    }));
  }, []);

  const completeOnboarding = useCallback(() => {
    setState((prev) => ({ ...prev, onboarded: true }));
  }, []);

  const resetDemo = useCallback(async () => {
    await clearState();
    setState(createInitialState());
  }, []);

  const value = useMemo(
    () => ({
      ready,
      state,
      alerts,
      getPlant,
      getLogsForPlant,
      addPlant,
      updatePlant,
      removePlant,
      logCare,
      setNotificationsEnabled,
      setDarkMode,
      setHomeLayout,
      acceptLegal,
      completeOnboarding,
      resetDemo,
    }),
    [
      ready,
      state,
      alerts,
      getPlant,
      getLogsForPlant,
      addPlant,
      updatePlant,
      removePlant,
      logCare,
      setNotificationsEnabled,
      setDarkMode,
      setHomeLayout,
      acceptLegal,
      completeOnboarding,
      resetDemo,
    ],
  );

  return <CopilotContext.Provider value={value}>{children}</CopilotContext.Provider>;
};

export const useCopilot = (): CopilotContextValue => {
  const ctx = useContext(CopilotContext);
  if (!ctx) throw new Error('useCopilot must be used within CopilotProvider');
  return ctx;
};
