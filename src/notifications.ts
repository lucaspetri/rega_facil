import { Linking, Platform } from 'react-native';
import Constants from 'expo-constants';

import { normalizeWaterDays, parseWaterTime } from './care';
import { DEFAULT_WATER_TIME, type Plant } from './models';

/**
 * Imports profundos — evita o barrel `expo-notifications` que no Expo Go
 * dispara avisos de "not fully supported" e "remote push unavailable".
 */
type LocalNotificationsApi = {
  setNotificationHandler: (typeof import('expo-notifications/build/NotificationsHandler'))['setNotificationHandler'];
  getPermissionsAsync: (typeof import('expo-notifications/build/NotificationPermissions'))['getPermissionsAsync'];
  requestPermissionsAsync: (typeof import('expo-notifications/build/NotificationPermissions'))['requestPermissionsAsync'];
  setNotificationChannelAsync: (typeof import('expo-notifications/build/setNotificationChannelAsync'))['setNotificationChannelAsync'];
  scheduleNotificationAsync: (typeof import('expo-notifications/build/scheduleNotificationAsync'))['scheduleNotificationAsync'];
  cancelAllScheduledNotificationsAsync: (typeof import('expo-notifications/build/cancelAllScheduledNotificationsAsync'))['cancelAllScheduledNotificationsAsync'];
  AndroidImportance: (typeof import('expo-notifications/build/NotificationChannelManager.types'))['AndroidImportance'];
  SchedulableTriggerInputTypes: (typeof import('expo-notifications/build/Notifications.types'))['SchedulableTriggerInputTypes'];
};

const isExpoGo =
  Constants.appOwnership === 'expo' ||
  Constants.executionEnvironment === 'storeClient';

let api: LocalNotificationsApi | null = null;
let loadError: Error | null = null;
let androidChannelId: string | null = null;
let handlerReady = false;

const loadLocalNotifications = async (): Promise<LocalNotificationsApi | null> => {
  if (loadError) return null;
  if (api) return api;
  try {
    const [
      handlerMod,
      permissionsMod,
      channelMod,
      scheduleMod,
      cancelMod,
      channelTypes,
      notifTypes,
    ] = await Promise.all([
      import('expo-notifications/build/NotificationsHandler'),
      import('expo-notifications/build/NotificationPermissions'),
      import('expo-notifications/build/setNotificationChannelAsync'),
      import('expo-notifications/build/scheduleNotificationAsync'),
      import('expo-notifications/build/cancelAllScheduledNotificationsAsync'),
      import('expo-notifications/build/NotificationChannelManager.types'),
      import('expo-notifications/build/Notifications.types'),
    ]);

    api = {
      setNotificationHandler: handlerMod.setNotificationHandler,
      getPermissionsAsync: permissionsMod.getPermissionsAsync,
      requestPermissionsAsync: permissionsMod.requestPermissionsAsync,
      setNotificationChannelAsync: channelMod.setNotificationChannelAsync,
      scheduleNotificationAsync: scheduleMod.scheduleNotificationAsync,
      cancelAllScheduledNotificationsAsync: cancelMod.cancelAllScheduledNotificationsAsync,
      AndroidImportance: channelTypes.AndroidImportance,
      SchedulableTriggerInputTypes: notifTypes.SchedulableTriggerInputTypes,
    };

    if (!handlerReady) {
      api.setNotificationHandler({
        handleNotification: async () => ({
          shouldPlaySound: true,
          shouldSetBadge: false,
          shouldShowBanner: true,
          shouldShowList: true,
        }),
      });
      handlerReady = true;
    }

    return api;
  } catch (error) {
    loadError = error instanceof Error ? error : new Error(String(error));
    console.warn('[notifications] indisponível:', loadError.message);
    return null;
  }
};

export const ensureAndroidChannel = async () => {
  // Expo Go rejeita ExpoNotificationChannelManager — não chamar lá.
  if (Platform.OS !== 'android' || isExpoGo) return;
  if (androidChannelId) return;

  const Notifications = await loadLocalNotifications();
  if (!Notifications) return;

  try {
    await Notifications.setNotificationChannelAsync('care', {
      name: 'Cuidados do jardim',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
    androidChannelId = 'care';
  } catch {
    androidChannelId = null;
  }
};

/** Pede permissão de notificação local (como apps comuns). */
export const requestNotificationPermission = async (): Promise<boolean> => {
  const Notifications = await loadLocalNotifications();
  if (!Notifications) return false;
  try {
    await ensureAndroidChannel();
    const current = await Notifications.getPermissionsAsync();
    if (current.granted) return true;
    const next = await Notifications.requestPermissionsAsync();
    return next.granted;
  } catch (error) {
    console.warn('[notifications] permissão falhou', error);
    return false;
  }
};

export const openSystemNotificationSettings = async () => {
  try {
    if (Platform.OS === 'android') {
      await Linking.openSettings();
      return;
    }
    await Linking.openURL('app-settings:');
  } catch (error) {
    console.warn('[notifications] abrir configurações falhou', error);
  }
};

const androidContentExtras = (): { channelId?: string } => {
  if (Platform.OS !== 'android' || !androidChannelId) return {};
  return { channelId: androidChannelId };
};

/** Agenda lembretes semanais de rega + data única de adubo. */
export const syncPlantWaterNotifications = async (
  enabled: boolean,
  plants: Plant[],
): Promise<void> => {
  const Notifications = await loadLocalNotifications();
  if (!Notifications) return;

  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
    if (!enabled) return;
    await ensureAndroidChannel();

    for (const plant of plants) {
      const waterDays = normalizeWaterDays(plant.waterDays);
      const waterTime = plant.waterTime || DEFAULT_WATER_TIME;
      const { hour, minute } = parseWaterTime(waterTime);

      for (const day of waterDays) {
        const weekday = day + 1;
        await Notifications.scheduleNotificationAsync({
          content: {
            title: `Regar ${plant.name}`,
            body: `Hora de regar · ${waterTime}`,
            sound: true,
            data: { plantId: plant.id, kind: 'water' },
            ...androidContentExtras(),
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
            weekday,
            hour,
            minute,
          },
        });
      }

      if (plant.fertilizeDueAt != null && plant.fertilizeDueAt > Date.now()) {
        const fertBody = plant.fertilizeNote
          ? `Chegou o dia de adubar · ${plant.fertilizeNote}`
          : 'Chegou o dia de adubar.';
        await Notifications.scheduleNotificationAsync({
          content: {
            title: `Adubar ${plant.name}`,
            body: fertBody,
            sound: true,
            data: { plantId: plant.id, kind: 'fertilize' },
            ...androidContentExtras(),
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DATE,
            date: new Date(plant.fertilizeDueAt),
          },
        });
      }
    }
  } catch (error) {
    console.warn('[notifications] agendamento falhou', error);
  }
};
