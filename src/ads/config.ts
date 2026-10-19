/**
 * IDs oficiais de teste do Google AdMob.
 * Em produção: troque App ID (app.json plugin) e unit IDs pelos reais do AdMob.
 * @see https://developers.google.com/admob/android/test-ads
 */
export const ADMOB_TEST_APP_ID_ANDROID = 'ca-app-pub-3940256099942544~3347511713';
export const ADMOB_TEST_APP_ID_IOS = 'ca-app-pub-3940256099942544~1458002511';

/** Unit IDs de banner de teste (em prod use ca-app-pub-XXXX/YYYY do AdMob). */
export const ADMOB_TEST_BANNER_ANDROID = 'ca-app-pub-3940256099942544/6300978111';
export const ADMOB_TEST_BANNER_IOS = 'ca-app-pub-3940256099942544/2934735716';

/**
 * Só banners ancorados na base — sem intersticial / app-open / rewarded.
 * Produção: defina IDs reais. Política pública: PRIVACY_POLICY_URL em legal/documents.ts.
 */
export const ADS_BANNER_ONLY = true as const;

/** Sem personalização até haver formulário de consentimento (UMP) — mais seguro na LGPD. */
export const ADS_NON_PERSONALIZED_ONLY = true as const;
