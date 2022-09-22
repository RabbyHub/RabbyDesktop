module.exports = {
  "productName": "Rabby Wallet",
  "appId": "com.debank.RabbyDesktop",
  "asar": true,
  "asarUnpack": "**\\*.{node,dll}",
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
        "arm64",
        "x64"
      ]
    },
    "type": "distribution",
    "hardenedRuntime": true,
    "entitlements": "assets/entitlements.mac.plist",
    "entitlementsInherit": "assets/entitlements.mac.plist",
    "gatekeeperAssess": false
  },
  "dmg": {
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
      "nsis"
    ]
  },
  "nsis": {
    "artifactName": "rabby-wallet-desktop.setup.${version}.${ext}",
    "uninstallDisplayName": "Rabby Wallet"
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
    "output": "release/build"
  },
  "extraResources": [
    "./assets/**"
  ],
  "publish": {
    "provider": "github",
    "owner": "RabbyHub",
    "repo": "RabbyHubDesktop"
  }
}
