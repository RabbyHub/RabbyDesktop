import { useRef, useState } from 'react';

export default function useRabbyLoaded() {
  const [extension, setExtension] = useState<Electron.Extension | null>(null);

  window.rabbyDesktop.ipcRenderer.once('chrome-extension-loaded', (arg) => {
    // eslint-disable-next-line no-console
    setExtension(arg.extension);
  });

  return extension;
}
