/** Perfil preview (APK de teste) tira o AdMob do app nativo. */
module.exports = ({ config }) => {
  const adsEnabled = process.env.EXPO_PUBLIC_ADS_ENABLED !== '0';
  if (adsEnabled) return config;

  return {
    ...config,
    plugins: (config.plugins ?? []).filter((plugin) => {
      const name = Array.isArray(plugin) ? plugin[0] : plugin;
      return name !== 'react-native-google-mobile-ads';
    }),
  };
};
