import { useCurrentAccount } from '@/renderer/hooks/rabbyx/useAccount';
import {
  IDisplayedAccountWithBalance,
  MatcherFunc,
  useAccountToDisplay,
  useRefreshAccountsOnContactBookChanged,
} from '@/renderer/hooks/rabbyx/useAccountToDisplay';
import { useAddressManagement } from '@/renderer/hooks/rabbyx/useAddressManagement';
import { useWhitelist } from '@/renderer/hooks/rabbyx/useWhitelist';
import { sortAccountsByBalance } from '@/renderer/utils/account';
import { KEYRING_CLASS } from '@/renderer/utils/constant';
import { groupBy } from 'lodash';
import React, { useCallback, useEffect, useState } from 'react';
import { useZPopupLayerOnMain } from '@/renderer/hooks/usePopupWinOnMainwin';
import { forwardMessageTo } from '@/renderer/hooks/useViewsMessage';
import { useRequest } from 'ahooks';
import useDebounceValue from '@/renderer/hooks/useDebounceValue';
import styles from './index.module.less';
import { Body } from './Body';
import { AddAddress } from './AddAddress';
import { Header } from './Header';
import { RefreshButton } from './RefreshButton';
import { CommonPopupProvider } from '../CommonPopup/CommonPopupProvider';
import RabbyInput from '../AntdOverwrite/Input';
import ManageAddress from './ManageAddress';

export const MainContainer: React.FC = () => {
  const { getHighlightedAddressesAsync, removeAddress, highlightedAddresses } =
    useAddressManagement();
  const {
    getAllAccountsToDisplay,
    accountsList,
    loadingAccounts,
    updateBalance,
    updateAllBalance,
  } = useAccountToDisplay();
  const { init: whitelistInit } = useWhitelist();
  const { currentAccount, switchAccount } = useCurrentAccount();
  const [selectedAccount, setSelectedAccount] =
    React.useState<IDisplayedAccountWithBalance>();
  const zActions = useZPopupLayerOnMain();
  const [isDeleted, setIsDeleted] = React.useState(false);
  const [searchKeyword, setSearchKeyword] = React.useState('');
  const debouncedSearchKeyword = useDebounceValue(searchKeyword, 250);

  const [sortedAccountsList, watchSortedAccountsList] = React.useMemo(() => {
    const restAccounts = [...accountsList];
    let highlightedAccounts: typeof accountsList = [];
    let watchModeHighlightedAccounts: typeof accountsList = [];

    highlightedAddresses.forEach((highlighted) => {
      const idx = restAccounts.findIndex(
        (account) =>
          account.address === highlighted.address &&
          account.brandName === highlighted.brandName
      );
      if (idx > -1) {
        if (restAccounts[idx].type === KEYRING_CLASS.WATCH) {
          watchModeHighlightedAccounts.push(restAccounts[idx]);
        } else {
          highlightedAccounts.push(restAccounts[idx]);
        }
        restAccounts.splice(idx, 1);
      }
    });
    const data = groupBy(restAccounts, (e) =>
      e.type === KEYRING_CLASS.WATCH ? '1' : '0'
    );

    highlightedAccounts = sortAccountsByBalance(highlightedAccounts);
    watchModeHighlightedAccounts = sortAccountsByBalance(
      watchModeHighlightedAccounts
    );

    const result = [
      highlightedAccounts.concat(data['0'] || []).filter((e) => !!e),
      watchModeHighlightedAccounts.concat(data['1'] || []).filter((e) => !!e),
    ];

    return [
      highlightedAccounts.concat(data['0'] || []).filter((e) => !!e),
      watchModeHighlightedAccounts.concat(data['1'] || []).filter((e) => !!e),
    ];
  }, [accountsList, highlightedAddresses]);

  const [sortedAccountsListAfterSearch, watchSortedAccountsListAfterSearch] =
    React.useMemo(() => {
      if (debouncedSearchKeyword) {
        const lKeyword = debouncedSearchKeyword.toLowerCase();
        return [
          [...sortedAccountsList, ...watchSortedAccountsList].filter(
            (account) => {
              const lowerAddress = account.address.toLowerCase();
              const aliasName = account.alianName?.toLowerCase();
              let addrIncludeKw = false;
              if (lKeyword.replace(/^0x/, '').length >= 2) {
                addrIncludeKw = account.address
                  .toLowerCase()
                  .includes(lKeyword.toLowerCase());
              }

              return (
                lowerAddress === lKeyword ||
                aliasName?.includes(lKeyword) ||
                addrIncludeKw
              );
            }
          ),
          [],
        ];
      }
      return [sortedAccountsList, watchSortedAccountsList];
    }, [sortedAccountsList, watchSortedAccountsList, debouncedSearchKeyword]);

  const accountList = React.useMemo(
    () => [...(sortedAccountsList || []), ...(watchSortedAccountsList || [])],
    [sortedAccountsList, watchSortedAccountsList]
  );

  const noAccount = React.useMemo(() => {
    return accountList.length <= 0 && !loadingAccounts;
  }, [accountList, loadingAccounts]);

  const currentAccountIndex = React.useMemo(() => {
    if (!currentAccount) {
      return -1;
    }
    return accountList.findIndex((e) =>
      (['address', 'brandName', 'type'] as const).every(
        (key) => e[key].toLowerCase() === currentAccount[key]?.toLowerCase()
      )
    );
  }, [accountList, currentAccount]);

  const currentDisplayAccount = accountList[currentAccountIndex];

  const handleSwitchAccount = React.useCallback(
    (account: IDisplayedAccountWithBalance) => {
      switchAccount(account);
      zActions.hideZSubview('address-management');
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [switchAccount]
  );

  const handleDelete = React.useCallback(
    async (account: IDisplayedAccountWithBalance) => {
      await removeAddress([account.address, account.type, account.brandName]);
      getHighlightedAddressesAsync();

      forwardMessageTo('main-window', 'on-deleted-account', {});
      setIsDeleted(true);
    },
    [removeAddress, getHighlightedAddressesAsync]
  );

  const {
    runAsync: handleUpdateAllBalance,
    loading: isUpdateAllBalanceLoading,
  } = useRequest(updateAllBalance, {
    manual: true,
    onSuccess: () => {},
  });

  React.useEffect(() => {
    getHighlightedAddressesAsync().then(getAllAccountsToDisplay);
    // avoid duplicated call
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useRefreshAccountsOnContactBookChanged(
    useCallback(
      ({ partials }) =>
        !!accountList.find((account) =>
          // eslint-disable-next-line no-prototype-builtins
          partials.hasOwnProperty(account.address)
        ),
      [accountList]
    ) as MatcherFunc,
    getAllAccountsToDisplay
  );

  React.useEffect(() => {
    whitelistInit();
  }, [whitelistInit]);

  React.useEffect(() => {
    // update balance
    if (currentDisplayAccount?.address) {
      updateBalance(currentDisplayAccount.address);
    }
  }, [currentDisplayAccount?.address, updateBalance]);

  React.useEffect(() => {
    if (selectedAccount) {
      zActions.showZSubview('address-detail', {
        account: selectedAccount,
        backable: true,
      });
      zActions.hideZSubview('address-management');

      setSelectedAccount(undefined);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedAccount]);

  React.useEffect(() => {
    if (isDeleted && noAccount) {
      zActions.hideZSubview('address-management');
    }
  }, [isDeleted, noAccount, zActions]);

  const [open, setOpen] = useState(false);

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  if (noAccount) {
    return null;
  }

  return (
    <div className={styles.MainContainer}>
      <CommonPopupProvider>
        <div className={styles.title}>Current Address</div>
        <AddAddress />
        <RefreshButton
          loading={isUpdateAllBalanceLoading}
          onClick={handleUpdateAllBalance}
        />
        <Header
          onSelect={setSelectedAccount}
          currentAccount={currentDisplayAccount}
          isUpdatingBalance={isUpdateAllBalanceLoading}
        />
        <div className={styles.search}>
          <RabbyInput
            className={styles.keyword}
            placeholder="Search"
            prefix={
              <img src="rabby-internal://assets/icons/address-management/search.svg" />
            }
            onChange={(e) => setSearchKeyword(e.target.value)}
            value={searchKeyword}
            allowClear
          />
          <div className={styles.addr} onClick={handleOpen}>
            <span className={styles.text}>Manage Address</span>
            <img src="rabby-internal://assets/icons/address-management/right.svg" />
          </div>
        </div>

        <Body
          onSelect={setSelectedAccount}
          onSwitchAccount={handleSwitchAccount}
          onDelete={handleDelete}
          accounts={sortedAccountsListAfterSearch}
          contacts={watchSortedAccountsListAfterSearch}
          isUpdatingBalance={isUpdateAllBalanceLoading}
        />
      </CommonPopupProvider>
      <ManageAddress visible={open} onCancel={handleClose} useDrawer showBack />
    </div>
  );
};
