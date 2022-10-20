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

export async function securityCheckDappBeforeOpen(dappUrl: string) {
  const reqid = randString();

  return new Promise<ISecurityCheckResult>((resolve, reject) => {
    const dispose = window.rabbyDesktop.ipcRenderer.on(
      '__internal_rpc:security-check:check-dapp',
      (event) => {
        const { reqid: _reqid, ...rest } = event;
        if (_reqid === reqid) {
          resolve(rest);
          dispose?.();
        }
      }
    );
    window.rabbyDesktop.ipcRenderer.sendMessage('__internal_rpc:security-check:check-dapp', reqid, dappUrl);
  });
}
