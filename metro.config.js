const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

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
