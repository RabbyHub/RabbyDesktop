import { walletController } from '@/renderer/ipcRequest/rabbyx';
import { useRequest } from 'ahooks';
import { atom, useAtom } from 'jotai';

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

  return {
    isShowTestnet,
    setIsShowTestnet,
    fetchIsShowTestnet,
  };
}
