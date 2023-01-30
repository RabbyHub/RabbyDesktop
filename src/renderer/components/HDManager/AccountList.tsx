import { message, Table } from 'antd';
import React from 'react';
import dayjs from 'dayjs';
import clsx from 'clsx';
import { useCopyToClipboard } from 'react-use';
import { walletController } from '@/renderer/ipcRequest/rabbyx';
import { isSameAddress } from '@/renderer/utils/address';
import { splitNumberByStep } from '@/renderer/utils/number';
import { isNil } from 'lodash';
import { AddToRabby } from './AddToRabby';
import { MAX_ACCOUNT_COUNT } from './AdvancedSettings';
import { AccountListSkeleton } from './AccountListSkeleton';
import { fetchAccountsInfo, HDManagerStateContext, Account } from './utils';
import { AliasName } from './AliasName';
import { ChainList } from './ChainList';

export interface Props {
  loading: boolean;
  data?: Account[];
  preventLoading?: boolean;
}

export const AccountList: React.FC<Props> = ({
  loading,
  data,
  preventLoading,
}) => {
  const [list, setList] = React.useState<Account[]>([]);
  const infoRef = React.useRef<HTMLDivElement>(null);
  const [infoColumnWidth, setInfoColumnWidth] = React.useState(0);
  const {
    currentAccounts,
    getCurrentAccounts,
    hiddenInfo,
    setHiddenInfo,
    createTask,
    keyringId,
    removeCurrentAccount,
    updateCurrentAccountAliasName,
    keyring,
  } = React.useContext(HDManagerStateContext);
  const [loadNum, setLoadNum] = React.useState(0);

  const toggleHiddenInfo = React.useCallback(
    (e: React.MouseEvent, val: boolean) => {
      e.preventDefault();
      setHiddenInfo(val);
    },
    []
  );
  const [, copyToClipboard] = useCopyToClipboard();
  const copy = React.useCallback((value: string) => {
    copyToClipboard(value);
  }, []);

  React.useEffect(() => {
    if (!hiddenInfo) {
      createTask(() => fetchAccountsInfo(data ?? []).then(setList));
    } else {
      setList(data ?? []);
    }
  }, [hiddenInfo, data]);

  const fullList = React.useMemo(() => {
    return list.map((item) => {
      const current = currentAccounts?.find((cur) =>
        isSameAddress(cur.address, item.address)
      );

      if (current) {
        item.aliasName = current.aliasName;
        item.checked = true;
      } else {
        item.checked = false;
        item.aliasName = undefined;
      }

      return item;
    });
  }, [list, currentAccounts]);

  const currentIndex = React.useMemo(() => {
    if (!preventLoading && list?.length) {
      return list.findIndex((item) => !item.address);
    }
    return -1;
  }, [list, preventLoading]);

  const handleAddAccount = React.useCallback(
    async (checked: boolean, account: Account) => {
      if (checked) {
        await createTask(() =>
          walletController.unlockHardwareAccount(
            keyring,
            [account.index - 1],
            keyringId
          )
        );

        await createTask(() =>
          walletController.requestKeyring(
            keyring,
            'setCurrentUsedHDPathType',
            keyringId
          )
        );

        // update current account list
        await createTask(() => getCurrentAccounts());
        message.success({
          content: 'The address is added to Rabby',
        });
      } else {
        await createTask(() =>
          walletController.removeAddress(account.address, keyring)
        );
        removeCurrentAccount(account.address);
        message.success({
          content: 'The address is removed from Rabby',
        });
      }
    },
    []
  );

  const handleChangeAliasName = React.useCallback(
    async (value: string, account?: Account) => {
      if (!account) {
        return;
      }
      await walletController.updateAlianName(account.address, value);
      updateCurrentAccountAliasName(account.address, value);
    },
    []
  );

  React.useEffect(() => {
    // watch infoRef resize
    const resizeObserver = new ResizeObserver(() => {
      setInfoColumnWidth(infoRef.current?.parentElement?.offsetWidth ?? 0);
    });
    resizeObserver.observe(infoRef.current ?? new Element());
    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  // fake loading progress
  React.useEffect(() => {
    let timer: NodeJS.Timer | undefined;
    if (loading) {
      setLoadNum(0);
      timer = setInterval(() => {
        setLoadNum((num) => {
          const random = Math.floor(Math.random() * 10) + 10;
          return num + random > 99 ? 99 : num + random;
        });
      }, 1000);
    } else {
      setLoadNum(0);
      if (timer) clearInterval(timer);
    }
    return () => {
      setLoadNum(0);
      if (timer) clearInterval(timer);
    };
  }, [loading]);

  return (
    <Table<Account>
      scroll={{ y: 'calc(100vh - 240px)' }}
      dataSource={fullList}
      rowKey="index"
      className="AccountList"
      loading={
        !preventLoading && loading
          ? {
              tip: `Waiting${loadNum ? ` - ${loadNum}%` : ''}`,
            }
          : false
      }
      pagination={false}
      summary={() =>
        list.length && hiddenInfo ? (
          <tr
            onClick={(e) => toggleHiddenInfo(e, !hiddenInfo)}
            className={clsx('info-mask', {
              'info-mask--center': list.length < 4,
            })}
            style={{
              width: `${infoColumnWidth}px`,
            }}
          >
            <td>
              <img
                className="icon"
                src="rabby-internal://assets/icons/hd-manager/arrow.svg"
              />
              <span>Click to get the information on-chain</span>
            </td>
          </tr>
        ) : null
      }
    >
      <Table.Column<Account>
        title="Add to Rabby"
        key="add"
        render={(val, record) =>
          record.address ? (
            <AddToRabby
              checked={record.checked}
              onChange={(v) => handleAddAccount(v, record)}
            />
          ) : (
            <AccountListSkeleton width={52} />
          )
        }
        width={120}
        align="center"
        className="cell-add"
      />

      <Table.ColumnGroup
        title={<div className="column-group">Basic information</div>}
        className="column-group-wrap"
      >
        <Table.Column
          width={45}
          title="#"
          dataIndex="index"
          key="index"
          className="cell-index"
        />
        <Table.Column<Account>
          title="Addresses"
          dataIndex="address"
          key="address"
          render={(value: string, record, index) =>
            value ? (
              <div className="cell-address">
                <span>{value.toLowerCase()}</span>
                <img
                  onClick={() => copy(value.toLowerCase())}
                  className="copy-icon"
                  src="rabby-internal://assets/icons/hd-manager/copy.svg"
                />
              </div>
            ) : (
              <AccountListSkeleton align="left" height={28} width={300}>
                {index === currentIndex
                  ? `Loading ${index + 1}/${MAX_ACCOUNT_COUNT} addresses`
                  : ''}
              </AccountListSkeleton>
            )
          }
        />
        <Table.Column<Account>
          width={180}
          title="Notes"
          dataIndex="aliasName"
          key="aliasName"
          className="cell-note"
          render={(value, record) => {
            return !record.address ? (
              <AccountListSkeleton align="left" width={100} />
            ) : (
              <AliasName
                address={record.address}
                aliasName={value}
                onChange={(val) => handleChangeAliasName(val, record)}
              />
            );
          }}
        />
      </Table.ColumnGroup>

      <Table.ColumnGroup
        className="column-group-wrap last"
        title={
          <div ref={infoRef} className="column-group">
            <button
              type="button"
              onClick={(e) => toggleHiddenInfo(e, !hiddenInfo)}
            >
              {hiddenInfo ? 'Get' : 'Hide'} on-chain information
            </button>
          </div>
        }
      >
        <Table.Column<Account>
          title="Used chains"
          dataIndex="usedChains"
          key="usedChains"
          width={140}
          render={(value, record) =>
            hiddenInfo ? (
              <AccountListSkeleton width={100} />
            ) : (
              <ChainList account={record} />
            )
          }
        />
        <Table.Column<Account>
          title="First transaction time"
          dataIndex="firstTxTime"
          key="firstTxTime"
          width={160}
          render={(value) =>
            hiddenInfo ? (
              <AccountListSkeleton width={100} />
            ) : !isNil(value) ? (
              dayjs.unix(value).format('YYYY-MM-DD')
            ) : null
          }
        />
        <Table.Column<Account>
          title="Balance"
          dataIndex="balance"
          key="balance"
          width={180}
          ellipsis
          render={(balance, record) =>
            hiddenInfo ? (
              <AccountListSkeleton width={100} />
            ) : record.chains?.length ? (
              `$${splitNumberByStep(balance.toFixed(2))}`
            ) : null
          }
        />
      </Table.ColumnGroup>
    </Table>
  );
};
