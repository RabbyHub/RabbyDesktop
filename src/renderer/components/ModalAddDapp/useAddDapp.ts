// import { IS_RUNTIME_PRODUCTION } from '@/isomorphic/constants';
import { usePopupViewInfo } from '@/renderer/hooks/usePopupWinOnMainwin';
import { atom, useAtom } from 'jotai';

const addUrlAtom = atom(
  ''
  // IS_RUNTIME_PRODUCTION ? 'https://' : 'https://debank.com'
);

export function useAddDappURL() {
  return useAtom(addUrlAtom);
}

/**
 * @description make sure this hooks used in your page-level app component.
 */
export function useSetNewDappOrigin() {
  const [, setAddUrl] = useAtom(addUrlAtom);

  usePopupViewInfo('dapps-management', {
    onVisibleChanged: (payload) => {
      if (!payload.visible) {
        setAddUrl('');
        return;
      }

      const newDappOrigin = payload.pageInfo?.state?.newDappOrigin;
      if (newDappOrigin) {
        setAddUrl(newDappOrigin);
      }
    },
  });
}
