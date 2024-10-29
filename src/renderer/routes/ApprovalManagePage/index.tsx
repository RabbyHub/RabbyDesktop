import React, { useCallback, useState, useMemo } from 'react';
import { Alert, Tooltip } from 'antd';
import type { ColumnType, TableProps } from 'antd/lib/table';
import { InfoCircleOutlined } from '@ant-design/icons';

import './style.less';

import { Chain, CHAINS_ENUM } from '@debank/common';
import { findChainByServerID } from '@/renderer/utils/chain';

import { VariableSizeGrid as VGrid } from 'react-window';
import { IconWithChain } from '@/renderer/components/TokenWithChain';
import {
  ContractApprovalItem,
  AssetApprovalSpender,
  getSpenderApprovalAmount,
  RiskNumMap,
  compareAssetSpenderByAmount,
  compareAssetSpenderByType,
} from '@/renderer/utils/approval';
import { ApprovalSpenderItemToBeRevoked } from '@/isomorphic/approve';
import clsx from 'clsx';
import { SorterResult } from 'antd/lib/table/interface';
import { formatUsdValue } from '@/renderer/utils/number';
import { IS_WINDOWS, KEYRING_CLASS } from '@/renderer/utils/constant';
import { useShellWallet } from '@/renderer/hooks-shell/useShellWallet';
import { firstEl } from '@/isomorphic/array';

import IconExternal from '@/../assets/icons/common/share.svg';
import PillsSwitch from '@/renderer/components/PillsSwitch';
import NetSwitchTabs, {
  useSwitchNetTab,
} from '@/renderer/components/PillsSwitch/NetSwitchTabs';
import {
  HandleClickTableRow,
  IVGridContextualPayload,
  VirtualTable,
} from './components/Table';

import IconSearch from './icons/search.svg';
import IconUnknown from './icons/icon-unknown-1.svg';

import IconQuestion from './icons/question.svg';
import IconRowArrowRight from './icons/row-arrow-right.svg';

import {
  SwitchPills,
  useApprovalsPage,
  useTableScrollableHeight,
  IHandleChangeSelectedSpenders,
  useSelectSpendersToRevoke,
} from './useApprovalsPage';

import {
  checkCompareContractItem,
  formatTimeFromNow,
  findIndexRevokeList,
  isRiskyContract,
  toRevokeItem,
  encodeRevokeItemIndex,
  getFinalRiskInfo,
  openScanLinkFromChainItem,
  encodeRevokeItem,
  decodeRevokeItem,
  TableSelectResult,
} from './utils';
import { RevokeApprovalModal } from './components/RevokeApprovalModal';
import { RISKY_ROW_HEIGHT, ROW_HEIGHT } from './constant';
import { RevokeButton } from './components/RevokeButton';
import SearchInput from './components/SearchInput';
import { useInspectRowItem } from './components/ModalDebugRowItem';
import ApprovalsNameAndAddr from './components/NameAndAddr';

import { useConfirmRevokeModal } from './components/BatchRevoke/useConfirmRevokeModal';
import { useBatchRevokeModal } from './components/BatchRevoke/useBatchRevokeModal';
import { AssetRow } from './components/AssetRow';
import { SpenderRow } from './components/SpenderRow';
import { CheckboxRow } from './components/CheckboxRow';
import { ChainSelectorButton } from './components/ChainSelectorButton';

const DEFAULT_SORT_ORDER = 'descend';
function getNextSort(currentSort?: 'ascend' | 'descend' | null) {
  return currentSort === 'ascend' ? 'descend' : ('ascend' as const);
}
const DEFAULT_SORT_ORDER_TUPLE = ['descend', 'ascend'] as const;

function getColumnsForContract({
  sortedInfo,
  selectedRows = [],
  onChangeSelectedContractSpenders,
  toggleSelectAll,
  isSelectedAll,
  isIndeterminate,
}: {
  sortedInfo: SorterResult<ContractApprovalItem>;
  selectedRows: ApprovalSpenderItemToBeRevoked[];
  onChangeSelectedContractSpenders: IHandleChangeSelectedSpenders<ContractApprovalItem>;
  toggleSelectAll: () => void;
} & TableSelectResult) {
  const columnsForContract: ColumnType<ContractApprovalItem>[] = [
    {
      title: () => (
        <CheckboxRow
          onClick={toggleSelectAll}
          isIndeterminate={isIndeterminate}
          isSelected={isSelectedAll}
        />
      ),
      key: 'selection',
      className: 'J_selection',
      render: (_, contractApproval) => {
        const selectedSpenderHosts = contractApproval.list.filter(
          (spenderHost) => {
            return (
              findIndexRevokeList(selectedRows, {
                item: contractApproval,
                spenderHost,
                itemIsContractApproval: true,
              }) > -1
            );
          }
        );

        const itemIsIndeterminate =
          selectedSpenderHosts.length > 0 &&
          selectedSpenderHosts.length < contractApproval.list.length;

        return (
          <CheckboxRow
            onClick={(evt) => {
              evt.stopPropagation();

              const nextSelectAll =
                itemIsIndeterminate || selectedSpenderHosts.length === 0;
              let revokeItems: ApprovalSpenderItemToBeRevoked[] = [];
              if (nextSelectAll) {
                const set = new Set<string>();
                contractApproval.list.forEach((spenderHost) => {
                  const revokeItem = toRevokeItem(
                    contractApproval,
                    spenderHost,
                    true
                  );
                  if (!revokeItem) return;
                  set.add(encodeRevokeItem(revokeItem));
                });
                revokeItems = [...set].map((key) => decodeRevokeItem(key));
              }

              onChangeSelectedContractSpenders({
                approvalItem: contractApproval,
                selectedRevokeItems: revokeItems,
              });
            }}
            isIndeterminate={itemIsIndeterminate}
            isSelected={!!selectedSpenderHosts.length}
          />
        );
      },
      width: 80,
    },
    // Contract
    {
      title: () => <span>Contract</span>,
      key: 'contract',
      dataIndex: 'key',
      render: (_, row, rowIndex) => {
        const chainItem = findChainByServerID(row.chain as Chain['serverId']);
        if (!chainItem) return null;

        const risky = isRiskyContract(row);

        const contractName = row.name || 'Unknown';

        return (
          <div className="flex flex-col justify-between">
            <div className="contract-basic-info flex items-center">
              <IconWithChain
                width="18px"
                height="18px"
                hideConer
                hideChainIcon
                iconUrl={chainItem?.logo || IconUnknown}
                chainServerId={chainItem.serverId}
                noRound={false}
              />

              <ApprovalsNameAndAddr
                className="ml-[6px]"
                addressClass=""
                address={row.id}
                chainEnum={chainItem.enum}
                addressSuffix={
                  <>
                    <span
                      className="contract-name ml-[4px] text-r-neutral-body"
                      title={contractName}
                    >
                      ({contractName})
                    </span>
                    <img
                      onClick={(evt) => {
                        evt.stopPropagation();
                        openScanLinkFromChainItem(chainItem?.scanLink, row.id);
                      }}
                      src={IconExternal}
                      className={clsx('ml-6 w-[16px] h-[16px] cursor-pointer')}
                    />
                  </>
                }
              />
            </div>

            {risky && (
              <div className="mt-[14px]">
                <Alert
                  className={clsx(
                    'rounded-[4px] px-[8px] py-[3px]',
                    row.risk_level === 'danger' ? 'bg-[#ec5151]' : 'bg-orange',
                    `J_risky_${row.risk_level}`,
                    'alert-with-caret'
                  )}
                  icon={
                    <InfoCircleOutlined className="text-white pt-[4px] self-start" />
                  }
                  banner
                  message={
                    <span className="text-12 text-white">{row.risk_alert}</span>
                  }
                  type="error"
                />
              </div>
            )}
          </div>
        );
      },
      width: 340,
    },
    // Contract Trust value
    {
      title: (props) => {
        return (
          <span className="inline-flex items-center justify-center">
            Contract Trust value
            <Tooltip
              overlayClassName="J-table__tooltip tip-column-contract-trust-value disable-ant-overwrite"
              overlay={
                <div className="text-[12px]">
                  <p className="leading-[16px]">
                    Trust value refers to the total asset value spent by this
                    contract.A low trust value indicates either risk or
                    inactivity for 180 days.
                  </p>
                </div>
              }
              // visible
            >
              <img
                className={`ml-[4px] w-[12px] h-[12px] relative ${
                  IS_WINDOWS && 'top-[1px]'
                }`}
                src={IconQuestion}
              />
            </Tooltip>
          </span>
        );
      },
      key: 'contractTrustValue',
      sortDirections: [...DEFAULT_SORT_ORDER_TUPLE],
      showSorterTooltip: false,
      sorter: (a, b) => {
        const checkResult = checkCompareContractItem(
          a,
          b,
          sortedInfo,
          'contractTrustValue'
        );
        if (checkResult.shouldEarlyReturn)
          return checkResult.keepRiskFirstReturnValue;

        return (
          a.$riskAboutValues.risk_spend_usd_value -
          b.$riskAboutValues.risk_spend_usd_value
        );
      },
      sortOrder:
        sortedInfo.columnKey === 'contractTrustValue' ? sortedInfo.order : null,
      render(_, row) {
        if (row.type !== 'contract') return null;

        const isDanger =
          row.$contractRiskEvaluation.extra.clientSpendScore >=
          RiskNumMap.danger;
        const isWarning =
          !isDanger &&
          row.$contractRiskEvaluation.extra.clientSpendScore >=
            RiskNumMap.warning;

        const isRisk = isDanger || isWarning;

        return (
          <Tooltip
            overlayClassName={clsx(
              'J-risk-cell__tooltip disable-ant-overwrite tip-trust-value',
              {
                'is-warning': isWarning,
                'is-danger': isDanger,
              }
            )}
            overlay={
              <div className="text-[12px]">
                {isWarning && <p>{'The contract trust value < $100,000'}</p>}
                {isDanger && <p>{'The  contract trust value < $10,000'}</p>}
              </div>
            }
            {...(!isDanger &&
              !isWarning && {
                visible: false,
              })}
            // // leave here for debug
            // {...(isDanger || isWarning) && {
            //   visible: true,
            // }}
          >
            <span
              className={clsx(isRisk && 'J-risk-cell__text', 'text-wrapper', {
                'is-warning': isWarning,
                'is-danger': isDanger,
              })}
            >
              {formatUsdValue(row.$riskAboutValues.risk_spend_usd_value || 0)}
            </span>
          </Tooltip>
        );
      },
      width: 220,
    },
    // 24h Revoke Trends
    {
      title: () => <span>24h Revoke Trends</span>,
      key: 'recentRevokes',
      dataIndex: 'revoke_user_count',
      sortDirections: [...DEFAULT_SORT_ORDER_TUPLE],
      showSorterTooltip: false,
      sorter: (a, b) => {
        const checkResult = checkCompareContractItem(
          a,
          b,
          sortedInfo,
          'recentRevokes'
        );
        if (checkResult.shouldEarlyReturn)
          return checkResult.keepRiskFirstReturnValue;

        return (
          a.$riskAboutValues.revoke_user_count -
          b.$riskAboutValues.revoke_user_count
        );
      },
      sortOrder:
        sortedInfo.columnKey === 'recentRevokes' ? sortedInfo.order : null,
      render: (_, row) => {
        if (row.type !== 'contract') return null;

        const isDanger =
          row.$contractRiskEvaluation.extra.clientApprovalScore >=
          RiskNumMap.danger;
        const isWarning =
          !isDanger &&
          row.$contractRiskEvaluation.extra.clientApprovalScore >=
            RiskNumMap.warning;

        const isRisk = isDanger || isWarning;

        return (
          <Tooltip
            overlayClassName={clsx(
              'J-risk-cell__tooltip disable-ant-overwrite tip-recent-revokes',
              {
                'is-warning': isWarning,
                'is-danger': isDanger,
              }
            )}
            overlay={
              <div className="text-[12px]">
                {isWarning && (
                  <p>
                    Recent revokes are greater than double the number of newly
                    approved users.
                  </p>
                )}
                {isDanger && (
                  <p>
                    Recent revokes are greater than 4 times the number of newly
                    approved users.
                  </p>
                )}
                <p>
                  Newly approved users(24h):{' '}
                  {row.$riskAboutValues.approve_user_count}
                </p>
                <p>
                  Recent revokes(24h): {row.$riskAboutValues.revoke_user_count}
                </p>
              </div>
            }
            {...(!isDanger &&
              !isWarning && {
                visible: false,
              })}
            // // leave here for debug
            // {...(isDanger || isWarning) && {
            //   visible: true,
            // }}
          >
            <span
              className={clsx(isRisk && 'J-risk-cell__text', {
                'is-warning': isWarning,
                'is-danger': isDanger,
              })}
            >
              {row.$riskAboutValues.revoke_user_count}
            </span>
          </Tooltip>
        );
      },
      width: 160,
    },
    // My Approval Time
    {
      title: () => <span>My Approval Time</span>,
      key: 'contractApprovalTime',
      dataIndex: 'last_approve_at',
      sortDirections: [...DEFAULT_SORT_ORDER_TUPLE],
      showSorterTooltip: false,
      sorter: (a, b) => {
        const checkResult = checkCompareContractItem(
          a,
          b,
          sortedInfo,
          'contractApprovalTime'
        );
        if (checkResult.shouldEarlyReturn)
          return checkResult.keepRiskFirstReturnValue;

        return (
          a.$riskAboutValues.last_approve_at -
          b.$riskAboutValues.last_approve_at
        );
      },
      sortOrder:
        sortedInfo.columnKey === 'contractApprovalTime'
          ? sortedInfo.order
          : null,
      render: (_, row) => {
        const time = row.$riskAboutValues.last_approve_at;

        return formatTimeFromNow(time ? time * 1e3 : 0);
      },
      width: 140,
    },
    // My Approved Assets
    {
      title: () => <span>My Approved Assets</span>,
      align: 'right',
      className: clsx('J_contracts_last_column', IS_WINDOWS && 'is-windows'),
      key: 'myApprovedAssets',
      dataIndex: 'approve_user_count',
      sortDirections: [...DEFAULT_SORT_ORDER_TUPLE],
      showSorterTooltip: false,
      sorter: (a, b) => {
        const checkResult = checkCompareContractItem(
          a,
          b,
          sortedInfo,
          'myApprovedAssets'
        );
        if (checkResult.shouldEarlyReturn)
          return checkResult.keepRiskFirstReturnValue;

        return a.list.length - b.list.length;
      },
      sortOrder:
        sortedInfo.columnKey === 'myApprovedAssets' ? sortedInfo.order : null,
      render: (_, row) => {
        const spenderHostList = row.list;
        const selectedContracts = spenderHostList.filter((spenderHost) => {
          return (
            findIndexRevokeList(selectedRows, {
              item: row,
              spenderHost,
              itemIsContractApproval: true,
            }) > -1
          );
        });
        return (
          <div className="flex items-center justify-end w-[100%] h-[100%]">
            <span className="block">
              {spenderHostList.length}
              {!selectedContracts.length ? null : (
                <span className="J_selected_count_text ml-[2px]">
                  ({selectedContracts.length})
                </span>
              )}
            </span>

            <img className="ml-[4px]" src={IconRowArrowRight} />
          </div>
        );
      },
      width: 180,
    },
  ];

  return columnsForContract;
}

function getColumnsForAsset({
  sortedInfo,
  selectedRows,
  toggleSelectAll,
  isSelectedAll,
  isIndeterminate,
}: {
  sortedInfo: SorterResult<AssetApprovalSpender>;
  selectedRows: ApprovalSpenderItemToBeRevoked[];
  toggleSelectAll: () => void;
} & TableSelectResult) {
  const isSelected = (record: AssetApprovalSpender) => {
    return (
      findIndexRevokeList(selectedRows, {
        item: record.$assetContract!,
        spenderHost: record.$assetToken!,
        assetApprovalSpender: record,
      }) > -1
    );
  };
  const columnsForAsset: ColumnType<AssetApprovalSpender>[] = [
    {
      title: () => (
        <CheckboxRow
          onClick={toggleSelectAll}
          isIndeterminate={isIndeterminate}
          isSelected={isSelectedAll}
        />
      ),
      key: 'selection',
      render: (_, spender) => {
        return <CheckboxRow isSelected={isSelected(spender)} />;
      },
      width: 80,
    },
    // Asset
    {
      title: () => <span>Asset</span>,
      key: 'asset',
      dataIndex: 'key',
      render: (_, row) => <AssetRow asset={row.$assetParent} />,
      width: 200,
    },
    // Type
    {
      title: () => <span>Type</span>,
      key: 'assetType',
      dataIndex: 'type',
      sortDirections: [...DEFAULT_SORT_ORDER_TUPLE],
      showSorterTooltip: false,
      sorter: (a, b) => {
        let comparison = compareAssetSpenderByType(a, b);
        if (comparison) return comparison;

        comparison = compareAssetSpenderByAmount(a, b);
        const isColumnAsc =
          sortedInfo.columnKey === 'assetType' && sortedInfo.order === 'ascend';

        return isColumnAsc ? -comparison : comparison;
      },
      sortOrder: sortedInfo.columnKey === 'assetType' ? sortedInfo.order : null,
      render: (_, row) => {
        const asset = row.$assetParent;
        if (!asset) return null;

        if (asset.type === 'nft') {
          const chainItem = findChainByServerID(
            asset.chain as Chain['serverId']
          );

          const imgNode = (
            <img
              onClick={(evt) => {
                evt.stopPropagation();
                openScanLinkFromChainItem(chainItem?.scanLink, asset.id);
              }}
              src={IconExternal}
              className={clsx('ml-6 w-[16px] h-[16px] cursor-pointer')}
            />
          );

          if (asset.nftContract) {
            return (
              <span className="capitalize inline-flex items-center">
                Collection
                {imgNode}
              </span>
            );
          }
          if (asset.nftToken) {
            return (
              <span className="capitalize inline-flex items-center">
                NFT
                {imgNode}
              </span>
            );
          }
        }

        return <span className="capitalize">{asset.type}</span>;
      },
      width: 140,
    },
    // Approved Amount
    {
      title: () => <span>Approved Amount</span>,
      key: 'approvedAmount',
      dataIndex: 'key',
      sortDirections: [...DEFAULT_SORT_ORDER_TUPLE],
      showSorterTooltip: false,
      sorter: (a, b) => compareAssetSpenderByAmount(a, b),
      sortOrder:
        sortedInfo.columnKey === 'approvedAmount' ? sortedInfo.order : null,
      render: (_, spender) => {
        const asset = spender.$assetParent;
        if (!asset) return null;

        const spendValues = getSpenderApprovalAmount(spender);

        return (
          <div className="text-14 overflow-hidden">
            <div>
              <Tooltip
                overlayClassName="J-table__tooltip disable-ant-overwrite"
                overlay="Approved Amount"
                align={{ offset: [0, 3] }}
                arrowPointAtCenter
              >
                <span className="text-r-neutral-title-1 truncate block">
                  {spendValues.displayAmountText}
                </span>
              </Tooltip>
            </div>
            <div className="mt-4">
              <Tooltip
                overlayClassName="J-table__tooltip disable-ant-overwrite"
                overlay="My Balance"
                align={{ offset: [0, 3] }}
                arrowPointAtCenter
              >
                <span className="text-r-neutral-foot">
                  {spendValues.displayBalanceText}
                </span>
              </Tooltip>
            </div>
          </div>
        );
      },
      width: 180,
    },
    // Approved Spender
    {
      title: () => <span>Approved Spender</span>,
      key: 'approveSpender',
      dataIndex: 'key',
      render: (_, spender) => <SpenderRow spender={spender} />,
      width: 340,
    },
    // My Approval Time
    {
      title: () => <span className="pl-[20px]">My Approval Time</span>,
      align: 'right',
      className: clsx('J_assets_last_column', IS_WINDOWS && 'is-windows'),
      key: 'assetApproveTime',
      dataIndex: 'key',
      sortDirections: [...DEFAULT_SORT_ORDER_TUPLE],
      showSorterTooltip: false,
      sorter: (a, b) => (a.last_approve_at || 0) - (b.last_approve_at || 0),
      sortOrder:
        sortedInfo.columnKey === 'assetApproveTime' ? sortedInfo.order : null,
      render: (_, row) => {
        const time = row.last_approve_at;

        return formatTimeFromNow(time ? time * 1e3 : 0);
      },
      width: 180,
    },
  ];

  return columnsForAsset;
}

const getRowHeight = (row: ContractApprovalItem) => {
  if (isRiskyContract(row)) return RISKY_ROW_HEIGHT;

  return ROW_HEIGHT;
};

const getCellKey = (params: IVGridContextualPayload<ContractApprovalItem>) => {
  return `${params.rowIndex}-${params.columnIndex}-${params.record.id}`;
};

const getCellClassName = (
  ctx: IVGridContextualPayload<ContractApprovalItem>
) => {
  const riskResult = getFinalRiskInfo(ctx.record);

  return clsx(
    riskResult.isServerRisk && 'is-contract-row__risky'
    // riskResult.isServerDanger && 'is-contract-row__danger',
    // riskResult.isServerWarning && 'is-contract-row__warning'
  );
};

type PageTableProps<T extends ContractApprovalItem | AssetApprovalSpender> = {
  isLoading: boolean;
  dataSource: T[];
  containerHeight: number;
  selectedRows: ApprovalSpenderItemToBeRevoked[];
  onClickRow?: HandleClickTableRow<T>;
  vGridRef: React.RefObject<VGrid>;
  className?: string;
} & TableSelectResult;
function TableByContracts({
  isLoading,
  dataSource,
  containerHeight,
  selectedRows = [],
  onClickRow,
  vGridRef,
  className,
  onChangeSelectedContractSpenders,
  toggleAllContractRevoke,
  isSelectedAll,
  isIndeterminate,
}: PageTableProps<ContractApprovalItem> & {
  toggleAllContractRevoke?: (list: ContractApprovalItem[]) => void;
  onChangeSelectedContractSpenders: IHandleChangeSelectedSpenders<ContractApprovalItem>;
}) {
  const [sortedInfo, setSortedInfo] = useState<
    SorterResult<ContractApprovalItem>
  >({
    columnKey: 'contractTrustValue',
    order: 'ascend',
  });

  const handleChange: Exclude<
    TableProps<ContractApprovalItem>['onChange'],
    void
  > = useCallback(
    (pagination, filters, sorters) => {
      const sorter = firstEl(sorters);
      // only one sorter supported here
      setSortedInfo((prev) => ({
        ...sorter,
        order: sorter.order ?? getNextSort(prev.order) ?? DEFAULT_SORT_ORDER,
      }));
      vGridRef.current?.resetAfterRowIndex(0, true);
    },
    [vGridRef]
  );

  const getContractListTotalHeight = useCallback(
    (rows: readonly ContractApprovalItem[]) => {
      return rows.reduce((accu, row) => {
        if (isRiskyContract(row)) {
          accu += RISKY_ROW_HEIGHT;
        } else {
          accu += ROW_HEIGHT;
        }
        return accu;
      }, 0);
    },
    []
  );

  const { onClickRowInspection } = useInspectRowItem(onClickRow);

  const columnsForContracts = useMemo(() => {
    return getColumnsForContract({
      selectedRows,
      sortedInfo,
      onChangeSelectedContractSpenders,
      toggleSelectAll: () => toggleAllContractRevoke?.(dataSource),
      isSelectedAll,
      isIndeterminate,
    });
  }, [
    dataSource,
    selectedRows,
    sortedInfo,
    onChangeSelectedContractSpenders,
    toggleAllContractRevoke,
    isSelectedAll,
    isIndeterminate,
  ]);

  return (
    <VirtualTable<ContractApprovalItem>
      loading={isLoading}
      vGridRef={vGridRef}
      className={clsx(className, 'J_table_by_contracts')}
      markHoverRow={false}
      columns={columnsForContracts}
      sortedInfo={sortedInfo}
      dataSource={dataSource}
      scroll={{ y: containerHeight, x: '100%' }}
      onClickRow={onClickRowInspection}
      getTotalHeight={getContractListTotalHeight}
      getRowHeight={getRowHeight}
      getCellKey={getCellKey}
      getCellClassName={getCellClassName}
      onChange={handleChange}
    />
  );
}

function TableByAssetSpenders({
  isLoading,
  dataSource,
  containerHeight,
  onClickRow,
  selectedRows = [],
  vGridRef,
  className,
  toggleAllAssetRevoke,
  isSelectedAll,
  isIndeterminate,
}: PageTableProps<AssetApprovalSpender> & {
  toggleAllAssetRevoke?: (list: AssetApprovalSpender[]) => void;
}) {
  const [sortedInfo, setSortedInfo] = useState<
    SorterResult<AssetApprovalSpender>
  >({
    columnKey: 'assetApproveTime',
    order: DEFAULT_SORT_ORDER,
  });

  const handleChange: Exclude<
    TableProps<AssetApprovalSpender>['onChange'],
    void
  > = useCallback((pagination, filters, sorters) => {
    // only one sorter supported here
    const sorter = firstEl(sorters);
    setSortedInfo((prev) => ({
      ...sorter,
      order: sorter.order ?? getNextSort(prev.order) ?? DEFAULT_SORT_ORDER,
    }));
  }, []);

  const { onClickRowInspection } = useInspectRowItem(onClickRow);
  const toggleSelectAll = () => toggleAllAssetRevoke?.(dataSource);

  return (
    <VirtualTable<AssetApprovalSpender>
      loading={isLoading}
      vGridRef={vGridRef}
      className={clsx(className, 'J_table_by_assets')}
      markHoverRow={false}
      columns={getColumnsForAsset({
        sortedInfo,
        selectedRows,
        toggleSelectAll,
        isSelectedAll,
        isIndeterminate,
      })}
      sortedInfo={sortedInfo}
      dataSource={dataSource}
      scroll={{ y: containerHeight, x: '100%' }}
      onClickRow={onClickRowInspection}
      // getRowHeight={(row) => ROW_HEIGHT}
      onChange={handleChange}
    />
  );
}

const ApprovalManagePage = () => {
  const { isShowTestnet, selectedTab, onTabChange } = useSwitchNetTab();

  const [chain, setChain] = React.useState<CHAINS_ENUM>();

  const {
    currentAccount: account,
    isLoading,
    loadApprovals,
    searchKw,
    setSearchKw,
    displaySortedContractList,
    displaySortedAssetsList,

    filterType,
    setFilterType,

    vGridRefContracts,
    vGridRefAsset,
  } = useApprovalsPage({ isTestnet: selectedTab === 'testnet', chain });

  const [visibleRevokeModal, setVisibleRevokeModal] = React.useState(false);
  const [selectedContract, setSelectedContract] =
    React.useState<ContractApprovalItem>();
  const selectedContractKey = useMemo(() => {
    return selectedContract ? encodeRevokeItemIndex(selectedContract) : '';
  }, [selectedContract]);
  const handleClickContractRow: HandleClickTableRow<ContractApprovalItem> =
    React.useCallback((ctx) => {
      setSelectedContract(ctx.record);
      setVisibleRevokeModal(true);
    }, []);

  const {
    handleClickAssetRow,
    contractRevokeMap,
    contractRevokeList,
    contractSelectResult,
    assetRevokeList,
    assetSelectResult,
    revokeSummary,
    patchContractRevokeMap,
    clearRevoke,
    onChangeSelectedContractSpenders,
    toggleAllAssetRevoke,
    toggleAllContractRevoke,
  } = useSelectSpendersToRevoke({
    filterType,
    displaySortedContractList,
    displaySortedAssetsList,
  });

  const wallet = useShellWallet();
  const handleRevoke = React.useCallback(async () => {
    return wallet
      .revoke({ list: revokeSummary.currentRevokeList })
      .then(() => {
        setVisibleRevokeModal(false);
        clearRevoke();
      })
      .catch((err) => {
        console.log(err);
      });
  }, [clearRevoke, revokeSummary.currentRevokeList, wallet]);

  const { yValue: containerHeight } = useTableScrollableHeight({
    hasNetSwitchTab: isShowTestnet,
  });

  const batchRevokeModal = useBatchRevokeModal({
    accountType: account?.type,
    revokeList: revokeSummary.currentRevokeList,
    dataSource: displaySortedAssetsList,
    onDone: () => {
      loadApprovals();
      clearRevoke();
    },
    onClose: (needUpdate) => {
      if (needUpdate) {
        loadApprovals();
        clearRevoke();
      }
    },
  });

  const confirmRevokeModal = useConfirmRevokeModal({
    revokeListCount: revokeSummary.currentRevokeList.length,
    onBatchRevoke: () => batchRevokeModal.show(),
    onRevokeOneByOne: () => handleRevoke(),
    accountType: account?.type,
  });

  const enableBatchRevoke = React.useMemo(() => {
    return (
      account?.type === KEYRING_CLASS.PRIVATE_KEY ||
      account?.type === KEYRING_CLASS.MNEMONIC ||
      account?.type === KEYRING_CLASS.HARDWARE.LEDGER
    );
  }, [account]);

  const onRevoke = React.useCallback(() => {
    if (revokeSummary.currentRevokeList.length > 1 && enableBatchRevoke) {
      confirmRevokeModal.show();
    } else {
      handleRevoke();
    }
  }, [
    revokeSummary.currentRevokeList.length,
    confirmRevokeModal,
    handleRevoke,
    enableBatchRevoke,
  ]);

  return (
    <div
      className={clsx(
        'approvals-manager-page',
        isShowTestnet && 'with-net-switch'
      )}
    >
      <div className="approvals-manager">
        <header className={clsx('approvals-manager__header')}>
          {isShowTestnet && (
            <div className="tabs">
              <NetSwitchTabs value={selectedTab} onTabChange={onTabChange} />
            </div>
          )}
        </header>
        {selectedTab === 'mainnet' ? (
          <>
            <main>
              <div className="approvals-manager__table-tools">
                <PillsSwitch
                  value={filterType}
                  options={SwitchPills}
                  onTabChange={(key) => setFilterType(key)}
                  className="bg-r-neutral-line"
                  itemClassnameActive="text-white"
                  itemClassname="text-[15px] w-[148px] h-[40px]"
                  itemClassnameInActive="text-white/80"
                />

                <div className="flex items-center gap-x-12">
                  <SearchInput
                    value={searchKw}
                    onChange={(e) => setSearchKw(e.target.value)}
                    prefix={<img src={IconSearch} />}
                    className="search-input"
                    suffix={<span />}
                    placeholder={`Search ${
                      filterType === 'contract' ? 'contract' : 'assets'
                    } by name/ address`}
                  />

                  <ChainSelectorButton
                    large
                    chain={chain}
                    setChain={setChain}
                  />
                </div>
              </div>

              <div className="approvals-manager__table-wrapper">
                <TableByContracts
                  isLoading={isLoading}
                  className={filterType === 'contract' ? '' : 'hidden'}
                  vGridRef={vGridRefContracts}
                  containerHeight={containerHeight}
                  dataSource={displaySortedContractList}
                  onClickRow={handleClickContractRow}
                  onChangeSelectedContractSpenders={
                    onChangeSelectedContractSpenders
                  }
                  selectedRows={contractRevokeList}
                  toggleAllContractRevoke={toggleAllContractRevoke}
                  isSelectedAll={contractSelectResult.isSelectedAll}
                  isIndeterminate={contractSelectResult.isIndeterminate}
                />

                <TableByAssetSpenders
                  className={filterType === 'assets' ? '' : 'hidden'}
                  isLoading={isLoading}
                  vGridRef={vGridRefAsset}
                  containerHeight={containerHeight}
                  dataSource={displaySortedAssetsList}
                  selectedRows={assetRevokeList}
                  onClickRow={handleClickAssetRow}
                  toggleAllAssetRevoke={toggleAllAssetRevoke}
                  isSelectedAll={assetSelectResult.isSelectedAll}
                  isIndeterminate={assetSelectResult.isIndeterminate}
                />
              </div>
              {selectedContract ? (
                <RevokeApprovalModal
                  item={selectedContract}
                  visible={visibleRevokeModal}
                  onClose={() => {
                    setVisibleRevokeModal(false);
                  }}
                  onConfirm={(list) => {
                    patchContractRevokeMap(selectedContractKey, list);
                  }}
                  revokeList={contractRevokeMap[selectedContractKey]}
                />
              ) : null}
              {batchRevokeModal.node}
            </main>
            <div className="sticky-footer">
              <RevokeButton
                revokeSummary={revokeSummary}
                enableBatchRevoke={enableBatchRevoke}
                onRevoke={onRevoke}
              />
            </div>
          </>
        ) : (
          <div className="h-[647px] w-full flex flex-col items-center justify-center bg-[rgba(0,0,0,0.10)] rounded-[8px]">
            <img src="rabby-internal://assets/icons/common/box.svg" alt="" />
            <div className="text-[14px] text-r-neutral-foot leading-[20px]">
              Not supported for custom networks
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ApprovalManagePage;
