import type { Account, IHighlightedAddress } from '@/isomorphic/types/rabbyx';
import { walletController } from '@/renderer/ipcRequest/rabbyx';
import { atom, useAtom } from 'jotai';
import React from 'react';
import { useAccountToDisplay } from './useAccountToDisplay';

const highlightedAddressesAtom = atom<IHighlightedAddress[]>([]);

export const useAddressManagement = () => {
  const { getAllAccountsToDisplay } = useAccountToDisplay();
  const [highlightedAddresses, setHighlightedAddresses] = useAtom(
    highlightedAddressesAtom
  );

  const getHighlightedAddressesAsync = React.useCallback(async () => {
    const addresses = await walletController.getHighlightedAddresses();

    setHighlightedAddresses(addresses);
  }, [setHighlightedAddresses]);

  const toggleHighlightedAddressAsync = React.useCallback(
    async (payload: {
      brandName: Account['brandName'];
      address: Account['address'];
      nextPinned?: boolean;
    }) => {
      const {
        nextPinned = !highlightedAddresses.some(
          (highlighted) =>
            highlighted.address === payload.address &&
            highlighted.brandName === payload.brandName
        ),
      } = payload;

      const addresses = [...highlightedAddresses];
      const newItem = {
        brandName: payload.brandName,
        address: payload.address,
      };
      if (nextPinned) {
        addresses.unshift(newItem);
        await walletController.updateHighlightedAddresses(addresses);
      } else {
        const toggleIdx = addresses.findIndex(
          (addr) =>
            addr.brandName === payload.brandName &&
            addr.address === payload.address
        );
        if (toggleIdx > -1) {
          addresses.splice(toggleIdx, 1);
        }
        await walletController.updateHighlightedAddresses(addresses);
      }

      setHighlightedAddresses(addresses);
      getHighlightedAddressesAsync();
    },
    [
      getHighlightedAddressesAsync,
      highlightedAddresses,
      setHighlightedAddresses,
    ]
  );

  const removeAddress = React.useCallback(
    async (payload: Parameters<typeof walletController.removeAddress>) => {
      await walletController.removeAddress(...payload);
      getAllAccountsToDisplay();
    },
    [getAllAccountsToDisplay]
  );

  return {
    highlightedAddresses,
    getHighlightedAddressesAsync,
    toggleHighlightedAddressAsync,
    removeAddress,
  };
};
