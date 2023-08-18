import React, { useEffect, useMemo, useRef, useState } from 'react';
import { InputProps, InputRef, Popover } from 'antd';
import { groupBy } from 'lodash';
import { useClickAway } from 'react-use';
import { useAddressManagement } from '@/renderer/hooks/rabbyx/useAddressManagement';
import { useAccountToDisplay } from '@/renderer/hooks/rabbyx/useAccountToDisplay';
import { KEYRING_CLASS } from '@/renderer/utils/constant';
import { sortAccountsByBalance } from '@/renderer/utils/account';
import useDebounceValue from '@/renderer/hooks/useDebounceValue';
import AddressItem from './AddressItem';
import RabbyInput from '../AntdOverwrite/Input';
import styles from './index.module.less';

function useSearchAccount(searchKeyword?: string) {
  const { highlightedAddresses, getHighlightedAddressesAsync } =
    useAddressManagement();

  const { accountsList, loadingAccounts, getAllAccountsToDisplay } =
    useAccountToDisplay();

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

  const debouncedSearchKeyword = useDebounceValue(searchKeyword, 250);

  const { accountList, filteredAccounts, noAnyAccount, noAnySearchedAccount } =
    useMemo(() => {
      const result = {
        accountList: [
          ...(sortedAccountsList || []),
          ...(watchSortedAccountsList || []),
        ],
        filteredAccounts: [] as typeof sortedAccountsList,
        noAnyAccount: false,
        noAnySearchedAccount: false,
      };
      result.filteredAccounts = [...result.accountList];

      if (debouncedSearchKeyword) {
        const lKeyword = debouncedSearchKeyword.toLowerCase();

        result.filteredAccounts = result.accountList.filter((account) => {
          const aliasName = account.alianName?.toLowerCase();
          let addrIncludeKw = false;
          if (lKeyword.replace(/^0x/, '').length >= 2) {
            addrIncludeKw = account.address
              .toLowerCase()
              .includes(lKeyword.toLowerCase());
          }
          return aliasName?.includes(lKeyword) || addrIncludeKw;
        });
      }

      result.noAnyAccount = result.accountList.length <= 0 && !loadingAccounts;
      result.noAnySearchedAccount =
        !!debouncedSearchKeyword &&
        result.filteredAccounts.length <= 0 &&
        !loadingAccounts;

      return result;
    }, [
      sortedAccountsList,
      watchSortedAccountsList,
      debouncedSearchKeyword,
      loadingAccounts,
    ]);

  useEffect(() => {
    getHighlightedAddressesAsync().then(() => {
      getAllAccountsToDisplay();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    accountList,
    filteredAccounts,
    noAnyAccount,
    noAnySearchedAccount,
  };
}

function NoSearchedAddressUI() {
  return (
    <div className="no-matched-address h-[156px]">
      <img
        className="w-[40px] h-[40px]"
        src="rabby-internal://assets/icons/account-search-input/not-match.svg"
        alt="no address"
      />
      <p className="text-13 mt-[10px] text-[#BABEC5]">No match address</p>
    </div>
  );
}

interface AccountSearchInputProps extends InputProps {
  onSelectedAccount?: (account: IDisplayedAccountWithBalance) => void;
}

const AccountSearchInput = React.forwardRef<InputRef, AccountSearchInputProps>(
  (
    {
      onSelectedAccount,
      value,
      onChange,
      ...inputProps
    }: AccountSearchInputProps,
    ref
  ) => {
    const searchKeyword = useMemo(() => `${value}`, [value]);
    const { filteredAccounts, noAnySearchedAccount } =
      useSearchAccount(searchKeyword);

    const [inputFocusing, setInputFocusing] = useState(false);

    const isInputAddrLike = useMemo(() => {
      return searchKeyword?.startsWith('0x') && searchKeyword?.length === 42;
    }, [searchKeyword]);

    const wrapperRef = useRef<HTMLDivElement>(null);

    useClickAway(wrapperRef, (event: MouseEvent) => {
      const targetEl = event.target as HTMLElement;
      const inComponent = wrapperRef.current?.contains(targetEl);
      if (!inComponent) {
        setInputFocusing(false);
      }
    });

    const content = useMemo(
      () => (
        <div className="account-search-input-results">
          {noAnySearchedAccount ? (
            <NoSearchedAddressUI />
          ) : (
            filteredAccounts.map((account, idx) => {
              return (
                <div
                  // eslint-disable-next-line react/no-array-index-key
                  key={`account-search-item-${account.brandName}-${account.address}-${idx}`}
                  className="account-search-item"
                >
                  <AddressItem
                    balance={account.balance}
                    address={account.address}
                    type={account.type}
                    brandName={account.brandName}
                    alias={account.alianName}
                    onConfirm={() => {
                      onSelectedAccount?.(account);
                    }}
                  />
                </div>
              );
            })
          )}
        </div>
      ),
      [filteredAccounts, noAnySearchedAccount, onSelectedAccount]
    );

    return (
      <div ref={wrapperRef} className={styles.wrapper}>
        <Popover
          trigger={['none']}
          visible={!!searchKeyword && !isInputAddrLike && inputFocusing}
          placement="bottom"
          className="account-search-popover-input"
          overlayClassName="account-search-input-overlay"
          align={{
            targetOffset: [0, 10],
          }}
          getPopupContainer={() => wrapperRef.current || document.body}
          destroyTooltipOnHide
          content={content}
        >
          <RabbyInput
            autoComplete="off"
            autoFocus
            spellCheck={false}
            {...inputProps}
            ref={ref}
            value={searchKeyword}
            onChange={onChange}
            onFocus={(e) => {
              setInputFocusing(true);
              inputProps.onFocus?.(e);
            }}
          />
        </Popover>
      </div>
    );
  }
);

export default AccountSearchInput;
