import { walletController } from '@/renderer/ipcRequest/rabbyx';
import { atom, useAtom } from 'jotai';
import React, { useEffect } from 'react';

const whitelistAtom = atom<string[]>([]);
const enableAtom = atom<boolean>(false);

export const useWhitelist = () => {
  const [whitelist, setWL] = useAtom(whitelistAtom);
  const [enable, setEnable] = useAtom(enableAtom);

  const getWhitelist = React.useCallback(async () => {
    const data = await walletController.getWhitelist();
    setWL(data);
  }, [setWL]);

  const setWhitelist = React.useCallback(
    async (addresses: string[]) => {
      await walletController.setWhitelist(addresses);
      setWL(addresses);
    },
    [setWL]
  );

  const toggleWhitelist = async (bool: boolean) => {
    await walletController.toggleWhitelist(bool);
    setEnable(bool);
  };

  const getWhitelistEnabled = React.useCallback(async () => {
    const data = await walletController.isWhitelistEnabled();
    setEnable(data);
  }, [setEnable]);

  const init = React.useCallback(async () => {
    getWhitelist();
    getWhitelistEnabled();
  }, [getWhitelist, getWhitelistEnabled]);

  useEffect(() => {
    init();
  }, [init]);

  return { init, whitelist, enable, setWhitelist, toggleWhitelist };
};
