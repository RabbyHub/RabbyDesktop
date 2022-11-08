const path = require('path');

const rootPath = path.join(__dirname, '../..');

const dllPath = path.join(__dirname, '../dll');

const srcPath = path.join(rootPath, 'src');
const srcMainPath = path.join(srcPath, 'main');
const srcRendererPath = path.join(srcPath, 'renderer');

const releasePath = path.join(rootPath, 'release');
const appPath = path.join(releasePath, 'app');
const appPackagePath = path.join(appPath, 'package.json');
const appNodeModulesPath = path.join(appPath, 'node_modules');
const srcNodeModulesPath = path.join(srcPath, 'node_modules');

const distPath = path.join(appPath, 'dist');
const distMainPath = path.join(distPath, 'main');
const distRendererPath = path.join(distPath, 'renderer');
const assetsPath = path.join(rootPath, 'assets');
const distExtsPath = path.join(rootPath, 'assets/chrome_exts');

const buildPath = path.join(releasePath, 'build');

type IEntry = {
  name: string;
  jsEntry: string;
  target?: string;
  htmlFile?: string;
}

const entriesRenderer = {
  home: {
    name: 'home',
    target: 'home.html',
    htmlFile: path.join(srcRendererPath, `home.ejs`),
    jsEntry: path.join(srcRendererPath, 'home.tsx'),
  },
  splash: {
    name: 'splash',
    target: 'splash.html',
    htmlFile: path.join(srcRendererPath, `splash.ejs`),
    jsEntry: path.join(srcRendererPath, 'splash.tsx'),
  },
  'getting-started': {
    name: 'getting-started',
    target: 'getting-started.html',
    htmlFile: path.join(srcRendererPath, `pages/getting-started.ejs`),
    jsEntry: path.join(srcRendererPath, 'pages/getting-started.tsx'),
  },
  loading: {
    name: 'loading',
    target: 'loading.html',
    htmlFile: path.join(srcRendererPath, `pages/loading.ejs`),
    jsEntry: path.join(srcRendererPath, 'pages/loading.tsx'),
  },
  'main-popup-view': {
    name: 'main-popup-view',
    target: 'main-popup-view.html',
    htmlFile: path.join(srcRendererPath, `pages/main-popup-view.ejs`),
    jsEntry: path.join(srcRendererPath, 'pages/main-popup-view.tsx'),
  },
  'popup-view': {
    name: 'popup-view',
    target: 'popup-view.html',
    htmlFile: path.join(srcRendererPath, `pages/popup-view.ejs`),
    jsEntry: path.join(srcRendererPath, 'pages/popup-view.tsx'),
  },
} as const;

const entriesShell = {
  '_shell-webui': {
    name: 'webui',
    target: 'webui.html',
    htmlFile: path.join(srcPath, `extension-shell/webui.ejs`),
    jsEntry: path.join(srcPath, 'extension-shell/webui.tsx'),
  } as IEntry,
  '_shell-new-tab': {
    name: 'new-tab',
    target: 'new-tab.html',
    htmlFile: path.join(srcPath, `extension-shell/new-tab.ejs`),
    jsEntry: path.join(srcPath, 'extension-shell/new-tab.tsx'),
  } as IEntry,
} as const;

const entriesRabby = {
  'rabby-background': {
    name: 'background',
    target: 'background.html',
    htmlFile: path.join(srcPath, `extension-wallet/background/background.html`),
    jsEntry: path.join(srcPath, 'extension-wallet/background/index.ts'),
  } as IEntry,
  'rabby-content-script': {
    name: 'content-script',
    jsEntry: path.join(srcPath, 'extension-wallet/content-script/index.ts'),
  } as IEntry,
} as const;

export default {
  rootPath,
  dllPath,
  srcPath,
  srcMainPath,
  srcRendererPath,
  releasePath,
  appPath,
  appPackagePath,
  appNodeModulesPath,
  srcNodeModulesPath,
  distPath,
  distMainPath,
  distRendererPath,
  distExtsPath,
  assetsPath,
  buildPath,
  entriesRenderer,
  entriesShell,
  entriesRabby,
};
