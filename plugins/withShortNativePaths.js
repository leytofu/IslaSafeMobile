const { withAppBuildGradle } = require("expo/config-plugins");

// RN's generated C++ object names exceed Ninja's Windows limit at a deep checkout path.
// Keep this generated staging directory at the mobile root so CMake's path hashing can fit.
module.exports = function withShortNativePaths(config) {
  return withAppBuildGradle(config, (config) => {
    const marker = "// IslaSafe short native staging path";
    if (!config.modResults.contents.includes(marker)) {
      config.modResults.contents += `\n${marker}\nandroid {\n    externalNativeBuild {\n        cmake {\n            buildStagingDirectory file("$rootDir/../.c")\n        }\n    }\n}\n`;
    }
    return config;
  });
};
