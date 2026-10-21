const { defineConfig } = require("eslint/config");
const expoConfig = require("eslint-config-expo/flat");
module.exports = defineConfig([
  expoConfig,
  // Bundled third-party JavaScript is generated and verified by map-document tests.
  { ignores: ["android/**", "dist/**", "src/lib/maplibreAssets.ts"] },
]);
