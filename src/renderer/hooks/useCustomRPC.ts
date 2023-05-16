import { RPCItem } from '@/isomorphic/types/rabbyx';
import { atom, useAtom } from 'jotai';
import { useCallback } from 'react';
import { walletController } from '../ipcRequest/rabbyx';

const customRPCAtom = atom<Record<CHAINS_ENUM, RPCItem>>({});
const customRPCStatusAtom = atom<
  Record<CHAINS_ENUM, 'pending' | 'avaliable' | 'unavaliable'>
>({});

export function useCustomRPC() {
  const [store, setStore] = useAtom(customRPCAtom);
  const [status, setStatus] = useAtom(customRPCStatusAtom);

  const getAllRPC = useCallback(async () => {
    const data = await walletController.getAllCustomRPC();
    setStore(data);
  }, [setStore]);

  const pingCustomRPC = useCallback(
    async (chain: CHAINS_ENUM) => {
      if (!store[chain]?.enable) {
        return true;
      }
      try {
        setStatus((pre) => {
          return {
            ...pre,
            [chain]: 'pending',
          };
        });
        const v = await walletController.pingCustomRPC(chain);
        setStatus((pre) => {
          return {
            ...pre,
            [chain]: v ? 'avaliable' : 'unavaliable',
          };
        });
        return v;
      } catch (e) {
        setStatus((pre) => {
          return {
            ...pre,
            [chain]: 'unavaliable',
          };
        });
      }
    },
    [setStatus, store]
  );

  const setCustomRPC = useCallback(
    async (chain: CHAINS_ENUM, url: string) => {
      await walletController.setCustomRPC(chain, url);
      await getAllRPC();
      pingCustomRPC(chain);
    },
    [getAllRPC, pingCustomRPC]
  );

  const setRPCEnable = useCallback(
    async (chain: CHAINS_ENUM, enable: boolean) => {
      await walletController.setRPCEnable(chain, enable);
      await getAllRPC();
      if (enable) {
        pingCustomRPC(chain);
      }
    },
    [getAllRPC, pingCustomRPC]
  );

  const deleteCustomRPC = useCallback(
    async (chain: CHAINS_ENUM) => {
      await walletController.removeCustomRPC(chain);
      await getAllRPC();
      setStatus((pre) => {
        const current = { ...pre };
        delete current[chain];
        return current;
      });
    },
    [getAllRPC, setStatus]
  );

  const getRPCStatus = useCallback(
    (chain: CHAINS_ENUM) => {
      const current = store[chain];
      if (!current?.enable) {
        return null;
      }
      return status[chain];
    },
    [store, status]
  );

  const checkAllRPCStatus = useCallback(async () => {
    await Promise.all(Object.keys(store).map((chain) => pingCustomRPC(chain)));
  }, [pingCustomRPC, store]);

  return {
    data: store,
    status,
    getAllRPC,
    setCustomRPC,
    setRPCEnable,
    deleteCustomRPC,
    pingCustomRPC,
    getRPCStatus,
    checkAllRPCStatus,
  };
}
