import { useCurrentAccount } from '@/renderer/hooks/rabbyx/useAccount';
import {
  IDisplayedAccountWithBalance,
  useAccountToDisplay,
} from '@/renderer/hooks/rabbyx/useAccountToDisplay';
import { useAddressManagement } from '@/renderer/hooks/rabbyx/useAddressManagement';
import { useWhitelist } from '@/renderer/hooks/rabbyx/useWhitelist';
import { sortAccountsByBalance } from '@/renderer/utils/account';
import { KEYRING_CLASS } from '@/renderer/utils/keyring';
import { groupBy } from 'lodash';
import React from 'react';
import { AccountDetail } from './AccountDetail';
import styles from './AddressManagementDrawer.module.less';
import { Body } from './Body';
import { Footer } from './Footer';
import { Header } from './Header';

export const MainContainer: React.FC = () => {
  const { getHighlightedAddressesAsync, removeAddress, highlightedAddresses } =
    useAddressManagement();
  const { getAllAccountsToDisplay, accountsList, loadingAccounts } =
    useAccountToDisplay();
  const { init: whitelistInit } = useWhitelist();
  const { currentAccount, switchAccount } = useCurrentAccount();
  const [selectedAccount, setSelectedAccount] =
    React.useState<IDisplayedAccountWithBalance>();

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

    return [
      highlightedAccounts.concat(data['0'] || []).filter((e) => !!e),
      watchModeHighlightedAccounts.concat(data['1'] || []).filter((e) => !!e),
    ];
  }, [accountsList, highlightedAddresses]);

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
    },
    [switchAccount]
  );

  const handleDelete = React.useCallback(
    async (account: IDisplayedAccountWithBalance) => {
      await removeAddress([account.address, account.type, account.brandName]);
      getHighlightedAddressesAsync();
    },
    [removeAddress, getHighlightedAddressesAsync]
  );

  React.useEffect(() => {
    getHighlightedAddressesAsync().then(getAllAccountsToDisplay);
  }, [getHighlightedAddressesAsync, getAllAccountsToDisplay]);

  React.useEffect(() => {
    whitelistInit();
  }, [whitelistInit]);

  if (selectedAccount) {
    return (
      <div className={styles.MainContainer}>
        <AccountDetail
          account={selectedAccount}
          onClose={() => setSelectedAccount(undefined)}
          onDelete={(account) => {
            setSelectedAccount(undefined);
            handleDelete(account);
          }}
        />
      </div>
    );
  }

  return (
    <div className={styles.MainContainer}>
      <Header
        onSelect={setSelectedAccount}
        currentAccount={currentDisplayAccount}
      />
      <Body
        onSelect={setSelectedAccount}
        onSwitchAccount={handleSwitchAccount}
        onDelete={handleDelete}
        accounts={sortedAccountsList}
        contacts={watchSortedAccountsList}
      />
      <Footer />
    </div>
  );
};
