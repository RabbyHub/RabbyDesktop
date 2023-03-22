import { exposeToMainWorld, ipcRendererObj } from './base';

export async function injectAlertMethods() {
  exposeToMainWorld(
    '__RDPrompt',
    function (message?: string, defaultContent?: string) {
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
