import { walletController } from '@/renderer/ipcRequest/rabbyx';
import { isSameAddress } from '@/renderer/utils/address';
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

  const addWhitelist = React.useCallback(
    async (address: string) => {
      await walletController.addWhitelist(address);
      getWhitelist();
    },
    [getWhitelist]
  );

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

  const isAddrOnWhitelist = React.useCallback(
    (address?: string) => {
      if (!address) return false;

      return whitelist.find((item) =>
        isSameAddress(item, address.toLowerCase())
      );
    },
    [whitelist]
  );

  const init = React.useCallback(async () => {
    getWhitelist();
    getWhitelistEnabled();
  }, [getWhitelist, getWhitelistEnabled]);

  useEffect(() => {
    init();
  }, [init]);

  return {
    init,
    whitelist,
    enable,
    addWhitelist,
    setWhitelist,
    toggleWhitelist,
    isAddrOnWhitelist,
  };
};
