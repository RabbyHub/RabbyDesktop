import { useCallback } from 'react';
import { useCopyToClipboard } from 'react-use';
import { toastCopiedWeb3Addr } from '../components/TransparentToast';

export const useCopyAddress = () => {
  const [, copyToClipboard] = useCopyToClipboard();

  const copy = useCallback(
    (address: string) => {
      copyToClipboard(address);
      toastCopiedWeb3Addr(address);
    },
    [copyToClipboard]
  );

  return copy;
};
