const { contextBridge } = require('electron');

try {
  contextBridge.exposeInMainWorld('__RD_isDappView', true);
} catch (e) {
  console.error(e);
  window.__RD_isDappView = true;
}
