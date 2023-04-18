import { useCallback } from 'react';
import { useCopyToClipboard } from 'react-use';

export const useCopyAddress = () => {
  const [, copyToClipboard] = useCopyToClipboard();

  const copy = useCallback(
    (address: string) => {
      copyToClipboard(address);
    },
    [copyToClipboard]
  );

  return copy;
};
