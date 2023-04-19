import { useCallback } from 'react';
import { useCopyToClipboard } from 'react-use';
// import { toastCopied } from '../components/TransparentToast';

export const useCopy = () => {
  const [, copyToClipboard] = useCopyToClipboard();

  const copy = useCallback(
    (address: string) => {
      copyToClipboard(address);
      // toastCopied(address);
    },
    [copyToClipboard]
  );

  return copy;
};
