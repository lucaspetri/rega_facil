const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Expo Go (Android) não tem ExpoTopicSubscriptionModule — import do pacote
// quebrava o app. Força o stub JS em vez do .android nativo.
const topicStub = path.resolve(
  __dirname,
  'node_modules/expo-notifications/build/TopicSubscriptionModule.js',
);
const previousResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  const fromNotifications =
    typeof context.originModulePath === 'string' &&
    context.originModulePath.includes(`${path.sep}expo-notifications${path.sep}`);
  if (
    platform === 'android' &&
    fromNotifications &&
    (moduleName === './TopicSubscriptionModule' ||
      moduleName.endsWith('/TopicSubscriptionModule'))
  ) {
    return { type: 'sourceFile', filePath: topicStub };
  }
  if (previousResolveRequest) {
    return previousResolveRequest(context, moduleName, platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

// Workaround: no Windows + Android emulator, respostas multipart/mixed
// do Metro quebram o BundleDownloader (fica em "Building...").
// Força application/javascript no download do bundle.
const previousEnhance = config.server?.enhanceMiddleware;
config.server = {
  ...config.server,
  enhanceMiddleware: (middleware, server) => {
    const base = previousEnhance ? previousEnhance(middleware, server) : middleware;
    return (req, res, next) => {
      const url = req.url ?? '';
      if (url.includes('.bundle') && typeof req.headers.accept === 'string') {
        if (req.headers.accept.includes('multipart/mixed')) {
          req.headers.accept = 'application/javascript';
        }
      }
      return base(req, res, next);
    };
  },
};

module.exports = config;
