import { BrowserView } from "electron";

export function destroyBrowserWebview(view?: BrowserView | null) {
  if (!view) return ;

  // undocumented behaviors
  (view.webContents as any)?.destroyed?.();
  (view as any)?.destroyed?.();
}
