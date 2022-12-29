const { contextBridge } = require('electron');

try {
  contextBridge.exposeInMainWorld('__RD_isDappSafeView', true);
} catch (e) {
  console.error(e);
  window.__RD_isDappSafeView = true;
}
