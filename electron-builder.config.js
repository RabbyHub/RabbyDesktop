const fs = require("fs");
const path = require("path");

const { fingerprint } = require('./.erb/scripts/winSign');

// prod, reg
const buildchannel = process.env.buildchannel || 'reg';
const PLATFORM = process.platform;

/**
 * @return {import('electron-builder').Configuration['win'] & object}
 */
function getWindowsCert() {
  if (PLATFORM !== "win32") return {};

  if (buildchannel === "prod" && fingerprint) {
    console.log(`[getWindowsCert] will sign with fingerprint`);
    return {
      "sign": '.erb/scripts/winSign.js',
    }
  }

  const CERT_PWD = process.env.RABBY_DESKTOP_CODE_SIGINING_PASS;

  if (!CERT_PWD) {
    console.warn(`[getWindowsCert] RABBY_DESKTOP_CODE_SIGINING_PASS is not set.`);
    return {};
  }

  const selfSignCert = path.resolve(__dirname, "./scripts/code-signing/rabby-desktop-ca.pfx");

  return {
    "certificateFile": selfSignCert,
    "certificatePassword": CERT_PWD,
  }
}

/**
 * @type {import('electron-builder').Configuration}
 */
module.exports = {
  "productName": "Rabby Desktop",
  "appId": "com.debank.RabbyDesktop",
  "asar": true,
  "asarUnpack": "**\\*.{node,dll}",
  "copyright": "Copyright © 2022 rabby.io",
  "files": [
    "dist",
    "node_modules",
    "package.json"
  ],
  "afterSign": ".erb/scripts/notarize.js",
  "mac": {
    "identity": process.env.RABBY_APPLE_IDENTITY_NAME,
    "target": {
      "target": "default",
      "arch": [
        process.env.BUILD_ARCH || process.arch
      ]
    },
    "type": "distribution",
    "hardenedRuntime": true,
    "entitlements": "assets/entitlements.mac.plist",
    "entitlementsInherit": "assets/entitlements.mac.plist",
    "gatekeeperAssess": false,
    "extendInfo": {
      "NSCameraUsageDescription": "Require camera to support QR-based hardware wallet.",
      // "com.apple.security.device.camera": true,
      // "com.apple.security.cs.allow-unsigned-executable-memory": true
    }
  },
  "dmg": {
    "artifactName": "rabby-wallet-desktop-installer-${arch}-${version}.${ext}",
    "contents": [
      {
        "x": 130,
        "y": 220
      },
      {
        "x": 410,
        "y": 220,
        "type": "link",
        "path": "/Applications"
      }
    ]
  },
  "win": {
    "target": [
      {
        "target": "nsis",
        "arch": process.env.BUILD_ARCH || process.arch
      }
    ],
    "verifyUpdateCodeSignature": true,
    "signingHashAlgorithms": [
      "sha256"
    ],
    "signDlls": false,
    "rfc3161TimeStampServer": "http://timestamp.comodoca.com/rfc3161",
    ...getWindowsCert(),
  },
  "nsis": {
    "artifactName": "rabby-wallet-desktop-installer-${arch}-${version}.${ext}",
    "uninstallDisplayName": "${productName}",
    "deleteAppDataOnUninstall": true,
    "allowToChangeInstallationDirectory": false,
    "createDesktopShortcut": true,
  },
  "linux": {
    "target": [
      "AppImage"
    ],
    "category": "Development"
  },
  "directories": {
    "app": "release/app",
    "buildResources": "assets",
    "output": `release/build-${PLATFORM}-\${arch}-${buildchannel}`
  },
  "extraResources": [
    "./assets/**"
  ],
  "publish": [
    {
      "provider": "generic",
      // pointless now
      "url": `https://download.rabby.io/wallet-desktop/${PLATFORM}-\${arch}-${buildchannel}/`,
    },
  ]
}
