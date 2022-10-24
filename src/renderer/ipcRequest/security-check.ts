import { randString } from "../../isomorphic/string";

export async function securityCheckGetDappInfo(dappUrl: string) {
  const reqid = randString();

  return new Promise<IDapp | null>((resolve, reject) => {
    const dispose = window.rabbyDesktop.ipcRenderer.on(
      '__internal_rpc:security-check:get-dapp',
      (event) => {
        const { reqid: _reqid, dappInfo } = event;
        if (_reqid === reqid) {
          resolve(dappInfo);
          dispose?.();
        }
      }
    );
    window.rabbyDesktop.ipcRenderer.sendMessage('__internal_rpc:security-check:get-dapp', reqid, dappUrl);
  });
}

export async function queryAndPutDappSecurityCheckResult(dappUrl: string) {
  const reqid = randString();

  return new Promise<ISecurityCheckResult>((resolve, reject) => {
    const dispose = window.rabbyDesktop.ipcRenderer.on(
      '__internal_rpc:security-check:check-dapp-and-put',
      (event) => {
        const { reqid: _reqid, result, error } = event;
        if (_reqid === reqid) {
          if (error) {
            reject(error);
            return ;
          }

          resolve(result!);
          dispose?.();
        }
      }
    );
    window.rabbyDesktop.ipcRenderer.sendMessage('__internal_rpc:security-check:check-dapp-and-put', reqid, dappUrl);
  });
}

export async function continueOpenDapp(continualOpenId: string, url: string, dappSafeLevel: ISecurityCheckResult['resultLevel']) {
  window.rabbyDesktop.ipcRenderer.sendMessage('__internal_rpc:security-check:continue-open-dapp', continualOpenId, url);

  switch (dappSafeLevel) {
    case 'ok': {
      window.rabbyDesktop.ipcRenderer.sendMessage('__internal_rpc:security-check:close-view');
      break;
    }
    case 'danger':
    default:
      return ;
    case 'warning': {
      window.rabbyDesktop.ipcRenderer.sendMessage('__internal_rpc:security-check:set-view-top');
      break;
    }
  }
}
