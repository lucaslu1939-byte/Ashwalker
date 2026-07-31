const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

// expo-sqlite's web backend ships a WASM module that Metro needs to treat
// as an asset, plus cross-origin isolation headers for the SharedArrayBuffer
// it relies on. Without this, expo-sqlite silently fails to load on web.
config.resolver.assetExts.push("wasm");

config.server = {
  ...config.server,
  enhanceMiddleware: (middleware) => {
    return (req, res, next) => {
      res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
      res.setHeader("Cross-Origin-Embedder-Policy", "require-corp");
      middleware(req, res, next);
    };
  },
};

module.exports = config;
