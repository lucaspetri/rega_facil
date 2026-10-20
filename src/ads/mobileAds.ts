import { Platform } from 'react-native';
import Constants from 'expo-constants';

import {
  ADMOB_BANNER_ANDROID,
  ADMOB_TEST_BANNER_ANDROID,
  ADMOB_TEST_BANNER_IOS,
  ADS_ENABLED,
  USE_PRODUCTION_ADS,
} from './config';

type AdsModule = typeof import('react-native-google-mobile-ads');

let adsModule: AdsModule | null = null;
let loadError: Error | null = null;
let initialized = false;

/** Expo Go não tem o módulo nativo — nunca importar o pacote lá (quebra o app). */
export const canUseNativeAds = (): boolean => {
  if (!ADS_ENABLED) return false;
  if (Platform.OS === 'web') return false;
  // appOwnership === 'expo' → Expo Go
  if (Constants.appOwnership === 'expo') return false;
  return true;
};

export const isAdsNativeAvailable = (): boolean =>
  canUseNativeAds() && adsModule != null && !loadError;

export const getBannerUnitId = (mod?: AdsModule | null): string => {
  if (USE_PRODUCTION_ADS && Platform.OS === 'android') return ADMOB_BANNER_ANDROID;
  if (mod?.TestIds?.BANNER) return mod.TestIds.BANNER;
  return Platform.OS === 'ios' ? ADMOB_TEST_BANNER_IOS : ADMOB_TEST_BANNER_ANDROID;
};

export const loadAdsModule = async (): Promise<AdsModule | null> => {
  if (!canUseNativeAds()) {
    loadError = new Error('Ads só em development/production build');
    return null;
  }
  if (loadError && !adsModule) return null;
  if (adsModule) return adsModule;
  try {
    adsModule = await import('react-native-google-mobile-ads');
    return adsModule;
  } catch (error) {
    loadError = error instanceof Error ? error : new Error(String(error));
    console.warn('[ads] nativo indisponível:', loadError.message);
    return null;
  }
};

/** Inicializa o SDK. Sem intersticiais. Seguro no Expo Go (não-op). */
export const initializeMobileAds = async (): Promise<boolean> => {
  if (!canUseNativeAds()) return false;
  if (initialized) return true;
  const mod = await loadAdsModule();
  if (!mod) return false;
  try {
    const factory = mod.default;
    const api = typeof factory === 'function' ? factory() : null;
    if (!api || typeof api.initialize !== 'function') {
      loadError = new Error('SDK de ads inválido');
      return false;
    }
    if (typeof api.setRequestConfiguration === 'function') {
      await api.setRequestConfiguration({
        maxAdContentRating: mod.MaxAdContentRating.G,
        tagForChildDirectedTreatment: false,
        tagForUnderAgeOfConsent: false,
      });
    }
    await api.initialize();
    initialized = true;
    return true;
  } catch (error) {
    console.warn('[ads] initialize falhou', error);
    loadError = error instanceof Error ? error : new Error(String(error));
    return false;
  }
};

export const getAdsModuleSync = (): AdsModule | null => adsModule;
