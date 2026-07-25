const { withProjectBuildGradle, withGradleProperties } = require('expo/config-plugins');

function withRokidMaven(config) {
  return withProjectBuildGradle(config, (mod) => {
    if (mod.modResults.language === 'groovy') {
      let buildGradle = mod.modResults.contents;
      if (!buildGradle.includes('maven.rokid.com')) {
        buildGradle = buildGradle.replace(
          /maven\s*\{\s*url\s*'https:\/\/www\.jitpack\.io'\s*\}/,
          `maven { url 'https://www.jitpack.io' }\n    maven { url 'https://maven.rokid.com/repository/maven-public/' }`
        );
      }
      // Inject ext { minSdkVersion = 31 } before expo-root-project plugin
      if (!buildGradle.includes('ext {')) {
        buildGradle = buildGradle.replace(
          /apply plugin: "expo-root-project"/,
          `ext {\n  minSdkVersion = 31\n}\n\napply plugin: "expo-root-project"`
        );
      }
      mod.modResults.contents = buildGradle;
    }
    return mod;
  });
}

module.exports = (config) => {
  // Set minSdkVersion to 31 (required by CXR-L SDK)
  if (!config.android) config.android = {};
  if (!config.android.minSdkVersion) {
    config.android.minSdkVersion = 31;
  }

  // Inject Rokid maven repository + minSdkVersion ext
  config = withRokidMaven(config);

  return config;
};
