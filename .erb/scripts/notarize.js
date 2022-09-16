const { notarize } = require('electron-notarize');
const { appId } = require('../../electron-builder');

exports.default = async function notarizeMacos(context) {
  const { electronPlatformName, appOutDir } = context;
  if (electronPlatformName !== 'darwin') {
    return;
  }

  if (process.env.CI !== 'true') {
    console.warn('Skipping notarizing step. Packaging is not running in CI');
    return;
  }

  if (!('RABBY_APPLE_ID' in process.env && 'RABBY_APPLE_ID_PASS' in process.env)) {
    console.warn(
      'Skipping notarizing step. RABBY_APPLE_ID and RABBY_APPLE_ID_PASS env variables must be set'
    );
    return;
  }

  const appName = context.packager.appInfo.productFilename;

  console.log(`Notarizing app ${appName}...`);

  await notarize({
    tool: 'notarytool',
    appBundleId: appId,
    teamId: process.env.RABBY_APPLE_TEAM_ID,
    appPath: `${appOutDir}/${appName}.app`,
    appleId: process.env.RABBY_APPLE_ID,
    appleIdPassword: process.env.RABBY_APPLE_ID_PASS,
  });

  console.log(`Notarizied app ${appName}...`);
};
