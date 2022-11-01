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
const distShellPath = path.join(rootPath, 'assets/desktop_shell');

const buildPath = path.join(releasePath, 'build');

const rendererEntries = {
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

const shellEntries = {
  'shell-webui': {
    name: 'shell-webui',
    target: 'shell-webui.html',
    htmlFile: path.join(srcRendererPath, `shell-webui.ejs`),
    jsEntry: path.join(srcRendererPath, 'shell-webui.tsx'),
  },
  'shell-new-tab': {
    name: 'shell-new-tab',
    target: 'shell-new-tab.html',
    htmlFile: path.join(srcRendererPath, `shell-new-tab.ejs`),
    jsEntry: path.join(srcRendererPath, 'shell-new-tab.tsx'),
  },
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
  distShellPath,
  buildPath,
  rendererEntries,
  shellEntries,
};
