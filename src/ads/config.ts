/**
 * IDs oficiais de teste do Google AdMob.
 * Em produção: troque App ID (app.json plugin) e unit IDs pelos reais do AdMob.
 * @see https://developers.google.com/admob/android/test-ads
 */
export const ADMOB_TEST_APP_ID_ANDROID = 'ca-app-pub-3940256099942544~3347511713';
export const ADMOB_TEST_APP_ID_IOS = 'ca-app-pub-3940256099942544~1458002511';

/** Unit IDs de banner de teste (desenvolvimento). */
export const ADMOB_TEST_BANNER_ANDROID = 'ca-app-pub-3940256099942544/6300978111';
export const ADMOB_TEST_BANNER_IOS = 'ca-app-pub-3940256099942544/2934735716';

/** Banner real do app Android Rega Fácil. Só no build de produção. */
export const ADMOB_BANNER_ANDROID = 'ca-app-pub-2966997269072637/6781763201';

/** Build da loja define EXPO_PUBLIC_USE_PRODUCTION_ADS=1. */
export const USE_PRODUCTION_ADS = process.env.EXPO_PUBLIC_USE_PRODUCTION_ADS === '1';

/**
 * Só banners ancorados na base — sem intersticial / app-open / rewarded.
 * Produção: defina IDs reais. Política pública: PRIVACY_POLICY_URL em legal/documents.ts.
 */
export const ADS_BANNER_ONLY = true as const;

/** Sem personalização até haver formulário de consentimento (UMP) — mais seguro na LGPD. */
export const ADS_NON_PERSONALIZED_ONLY = true as const;

/**
 * APK de teste (perfil preview) define EXPO_PUBLIC_ADS_ENABLED=0.
 * Assim o build não inclui nem inicializa o AdMob.
 */
export const ADS_ENABLED = process.env.EXPO_PUBLIC_ADS_ENABLED !== '0';
