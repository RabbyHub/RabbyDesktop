import { walletController } from '@/renderer/ipcRequest/rabbyx';
import { onBackgroundStoreChanged } from '@/renderer/utils/broadcastToUI';
import { useRequest } from 'ahooks';
import { atom, useAtom } from 'jotai';
import { useEffect } from 'react';

const showTestnetAtom = atom({
  isShowTestnet: false,
});

export function useShowTestnet() {
  const [{ isShowTestnet }, setState] = useAtom(showTestnetAtom);

  const { runAsync: fetchIsShowTestnet } = useRequest(
    () => walletController.getIsShowTestnet(),
    {
      onSuccess: (value) => {
        setState({
          isShowTestnet: value,
        });
      },
    }
  );

  const { runAsync: setIsShowTestnet } = useRequest(
    walletController.setIsShowTestnet,
    {
      manual: true,
      onBefore(params) {
        setState({
          isShowTestnet: params[0],
        });
      },
      onSuccess() {
        fetchIsShowTestnet();
      },
    }
  );

  useEffect(() => {
    return onBackgroundStoreChanged(
      'preference',
      ({ changedKey, partials }) => {
        if (changedKey.includes('isShowTestnet')) {
          setState((prev) => {
            prev.isShowTestnet = partials.isShowTestnet!;
            return prev;
          });
        }
      }
    );
  }, [setState]);

  return {
    isShowTestnet: false,
    setIsShowTestnet,
    fetchIsShowTestnet,
  };
}
