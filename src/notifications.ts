import { Platform } from 'react-native';

import { normalizeWaterDays, parseWaterTime } from './care';
import { DEFAULT_WATER_TIME, type Plant } from './models';

type NotificationsModule = typeof import('expo-notifications');

let notifications: NotificationsModule | null = null;
let loadError: Error | null = null;

const getNotifications = async (): Promise<NotificationsModule | null> => {
  if (loadError) return null;
  if (notifications) return notifications;
  try {
    notifications = await import('expo-notifications');
    notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });
    return notifications;
  } catch (error) {
    loadError = error instanceof Error ? error : new Error(String(error));
    console.warn('[notifications] indisponível:', loadError.message);
    return null;
  }
};

export const ensureAndroidChannel = async () => {
  const Notifications = await getNotifications();
  if (!Notifications || Platform.OS !== 'android') return;
  try {
    await Notifications.setNotificationChannelAsync('care', {
      name: 'Cuidados do jardim',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  } catch (error) {
    console.warn('[notifications] canal android falhou', error);
  }
};

export const requestNotificationPermission = async (): Promise<boolean> => {
  const Notifications = await getNotifications();
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

/** Agenda lembretes semanais de rega + data única de adubo. */
export const syncPlantWaterNotifications = async (
  enabled: boolean,
  plants: Plant[],
): Promise<void> => {
  const Notifications = await getNotifications();
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
            ...(Platform.OS === 'android' ? { channelId: 'care' } : {}),
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
            ...(Platform.OS === 'android' ? { channelId: 'care' } : {}),
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
