import { ContactBookItem } from '@/isomorphic/types/rabbyx';
import { walletController } from '@/renderer/ipcRequest/rabbyx';
import { atom, useAtom } from 'jotai';
import { useCallback, useEffect } from 'react';
import { KEYRING_CLASS } from '@/renderer/utils/constant';
import { useAccounts } from './useAccount';

const contactsByAddrAtom = atom<Record<string, ContactBookItem>>({});

export function useContactsByAddr(opts?: { disableAutoFetch?: boolean }) {
  const { accounts, fetchAccounts } = useAccounts({ disableAutoFetch: true });
  const [contactsByAddr, setContactsByAddr] = useAtom(contactsByAddrAtom);
  const fetchContactsByAddr = useCallback(async () => {
    return Promise.allSettled([
      fetchAccounts(),
      walletController.getContactsByMap(),
    ]).then(([_, contactsRes]) => {
      const contacts =
        contactsRes.status === 'fulfilled' ? contactsRes.value : {};
      Object.values(contacts).forEach((item) => {
        if (item) {
          item.address = item.address.toLowerCase();
        }
      });

      setContactsByAddr(contacts);
    });
  }, [fetchAccounts, setContactsByAddr]);

  const isAddrOnContactBook = useCallback(
    (address?: string) => {
      if (!address) return false;

      return (
        !!contactsByAddr[address.toLowerCase()]?.isAlias &&
        accounts.find(
          (account) =>
            account.address === address && account.type === KEYRING_CLASS.WATCH
        )
      );
    },
    [accounts, contactsByAddr]
  );

  const getAddressNote = useCallback(
    (address?: string) => {
      if (!address) return '';

      return contactsByAddr[address.toLowerCase()]?.name || '';
    },
    [contactsByAddr]
  );

  useEffect(() => {
    if (!opts?.disableAutoFetch) {
      fetchContactsByAddr();
    }
  }, [fetchContactsByAddr, opts?.disableAutoFetch]);

  return {
    fetchContactsByAddr,
    isAddrOnContactBook,
    getAddressNote,
  };
}
