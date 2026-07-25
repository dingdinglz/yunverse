const { withProjectBuildGradle, withGradleProperties } = require('expo/config-plugins');

function withRokidMaven(config) {
  return withProjectBuildGradle(config, (mod) => {
    if (mod.modResults.language === 'groovy') {
      const buildGradle = mod.modResults.contents;
      if (!buildGradle.includes('maven.rokid.com')) {
        mod.modResults.contents = buildGradle.replace(
          /maven\s*\{\s*url\s*'https:\/\/www\.jitpack\.io'\s*\}/,
          `maven { url 'https://www.jitpack.io' }\n    maven { url 'https://maven.rokid.com/repository/maven-public/' }`
        );
      }
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

  // Inject Rokid maven repository
  config = withRokidMaven(config);

  return config;
};
