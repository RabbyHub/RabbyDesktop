import { useRef, useState } from "react";

export default function useRabbyLoaded () {
  const [extension, setExtension] = useState<Electron.Extension | null>(null);

  window.electron.ipcRenderer.once('chrome-extension-loaded', (arg) => {
    // eslint-disable-next-line no-console
    console.log('[feat] useRabbyLoaded:: arg', arg);
    setExtension(arg.extension);
  });

  return extension;
}