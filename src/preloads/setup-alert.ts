import { getBuiltinViewType } from '../isomorphic/url';
import { exposeToMainWorld, ipcRendererObj } from './base';

export async function injectAlertMethods() {
  if (getBuiltinViewType(window.location)) return;

  exposeToMainWorld(
    '__RDPrompt',
    function (message?: string, defaultContent?: string) {
      const { windowExisted } = ipcRendererObj.sendSync(
        '__internal_rpc:app:request-tab-mutex'
      );
      // pointless, because the if window is destroyed, message would be never sent back.
      // But we still check it here for consistency.
      if (!windowExisted) return;

      const returnValue = ipcRendererObj.sendSync(
        '__internal_rpc:app:prompt-open',
        {
          message,
          callerURL: window.location.href,
          defaultContent,
        }
      );

      return returnValue.value;
    }
  );
}
