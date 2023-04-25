import { useMessageForwarded } from '@/renderer/hooks/useViewsMessage';
import { atom, useAtom } from 'jotai';

const HDManagerLoadingAtom = atom<Record<HDManagerType, boolean>>({
  Trezor: false,
  Ledger: false,
  Onekey: false,
});

export function useHDManagerConnecWindowOpen(hdType: HDManagerType) {
  const [loadings, setLoadings] = useAtom(HDManagerLoadingAtom);

  useMessageForwarded(
    {
      targetView: 'z-popup',
      type: 'hardward-conn-window-opened-changed',
    },
    (data) => {
      if (data.payload.type === hdType) {
        setLoadings((prev) => ({
          ...prev,
          [hdType]: data.payload.opened,
        }));
      }
    }
  );

  return {
    isConnectWindowOpened: loadings[hdType],
  };
}
