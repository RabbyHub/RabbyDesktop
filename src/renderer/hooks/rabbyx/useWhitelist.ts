import { walletController } from '@/renderer/ipcRequest/rabbyx';
import { atom, useAtom } from 'jotai';
import React from 'react';

type IDisplayedAccount = Required<DisplayedKeyring['accounts'][number]>;
export type IDisplayedAccountWithBalance = IDisplayedAccount & {
  balance: number;
  byImport?: boolean;
};

const whitelistAtom = atom<string[]>([]);
const enableAtom = atom<boolean>(false);

export const useWhitelist = () => {
  const [whitelist, setWhitelist] = useAtom(whitelistAtom);
  const [enable, setEnable] = useAtom(enableAtom);

  const getWhitelist = React.useCallback(async () => {
    const data = await walletController.getWhitelist();
    setWhitelist(data);
  }, [setWhitelist]);

  const getWhitelistEnabled = React.useCallback(async () => {
    const data = await walletController.isWhitelistEnabled();
    setEnable(data);
  }, [setEnable]);

  const init = React.useCallback(async () => {
    getWhitelist();
    getWhitelistEnabled();
  }, [getWhitelist, getWhitelistEnabled]);

  return { init, whitelist, enable };
};
