import { atom, useAtom } from 'jotai';
import { useCallback, useEffect } from 'react';

const trezorLikeAvailabilityAtom = atom<ITrezorLikeCannotUserReason[]>([]);
const fetchingAtom = atom<boolean>(false);
export function useTrezorLikeAvailablity(
  uiData?: ITrezorLikeCannotUserReason['uiData']
) {
  const [trezorLikeAvailability, setTrezorLikeAvailability] = useAtom(
    trezorLikeAvailabilityAtom
  );
  const [isFetching, setIsFetching] = useAtom(fetchingAtom);

  const requestAlertIfCannotUse = useCallback(
    (type: IHardwareConnectPageType) => {
      return window.rabbyDesktop.ipcRenderer.invoke(
        'check-trezor-like-cannot-use',
        {
          openType: type,
          alertModal: true,
          uiData: { openFromAddAddressModal: uiData?.openFromAddAddressModal },
        }
      );
    },
    [uiData?.openFromAddAddressModal]
  );

  useEffect(() => {
    (async () => {
      if (isFetching) return;
      try {
        const result = await window.rabbyDesktop.ipcRenderer.invoke(
          'get-trezor-like-availability'
        );

        setTrezorLikeAvailability([
          ...result.trezor.reasons,
          ...result.onekey.reasons,
        ]);
      } catch (error) {
        console.error(error);
      } finally {
        setIsFetching(false);
      }
    })();
  }, [setTrezorLikeAvailability, isFetching, setIsFetching]);

  return {
    trezorLikeAvailability,
    requestAlertIfCannotUse,
  };
}
