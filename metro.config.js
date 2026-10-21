const { getDefaultConfig } = require("expo/metro-config");
const config = getDefaultConfig(__dirname);
const { createApiProxy } = require("./scripts/api-proxy.cjs");
const enhanceMiddleware = config.server.enhanceMiddleware;
config.server.enhanceMiddleware = (middleware, server) => {
  const next = enhanceMiddleware ? enhanceMiddleware(middleware, server) : middleware;
  const proxy = createApiProxy(process.env.ISLASAFE_API_UPSTREAM || "http://127.0.0.1:8000", console.info);
  return (req, res, fallback) => proxy(req, res, () => next(req, res, fallback));
};
const existing = config.resolver.blockList;
config.resolver.blockList = [
  ...(Array.isArray(existing) ? existing : existing ? [existing] : []),
  /[/\\]\.c[/\\]/,
  /[/\\]artifacts[/\\]/,
];
module.exports = config;
