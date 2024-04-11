import { walletController } from '../ipcRequest/rabbyx';
import { updateChainStore } from './chain';

export const initSyncChain = () => {
  walletController.getMainnetListFromLocal().then((list) => {
    if (list?.length) {
      updateChainStore({
        mainnetList: list,
      });
    }
  });

  window?.rabbyDesktop?.ipcRenderer?.on(
    '__internal_push:rabbyx:session-broadcast-forward-to-desktop',
    (payload) => {
      if (payload.event === 'syncChainList') {
        updateChainStore(payload.data || {});
      }
    }
  );
};
