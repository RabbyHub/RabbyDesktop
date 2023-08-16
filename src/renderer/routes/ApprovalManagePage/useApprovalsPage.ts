import {
  useState,
  useRef,
  useMemo,
  useLayoutEffect,
  useEffect,
  useCallback,
} from 'react';
import { useAsync, useAsyncFn } from 'react-use';

import { VariableSizeGrid } from 'react-window';
// @ts-expect-error
import PQueue from 'p-queue';

import { CHAINS_ENUM } from '@debank/common';
import {
  AssetApprovalItem,
  ContractApprovalItem,
  NftApprovalItem,
  TokenApprovalItem,
  getContractRiskEvaluation,
  makeComputedRiskAboutValues,
  markParentForAssetItemSpender,
} from '@/renderer/utils/approval';

import { groupBy, sortBy, flatten, debounce } from 'lodash';
import IconUnknownToken from '@/../assets/icons/common/token-default.svg';
import { useCurrentAccount } from '@/renderer/hooks/rabbyx/useAccount';
import { usePreference } from '@/renderer/hooks/rabbyx/usePreference';
import useDebounceValue from '@/renderer/hooks/useDebounceValue';
import { NFTApprovalContract } from '@rabby-wallet/rabby-api/dist/types';
import { walletOpenapi } from '@/renderer/ipcRequest/rabbyx';
import eventBus from '@/renderer/utils-shell/eventBus';
import IconUnknownNFT from './icons/unknown-nft.svg';

/**
 * @see `@sticky-top-height`, `@sticky-footer-height` in ./style.less
 */
function getYValue() {
  return window.innerHeight - 200 - 148;
}

export function useTableScrollableHeight() {
  const [yValue, setYValue] = useState(getYValue);

  useLayoutEffect(() => {
    const listener = debounce(() => {
      setYValue(getYValue());
    }, 500);

    window.addEventListener('resize', listener);

    return () => {
      window.removeEventListener('resize', listener);
    };
  });

  return {
    yValue,
  };
}

const FILTER_TYPES = {
  contract: 'By Contracts',
  assets: 'By Assets',
} as const;

export const SwitchPills = [
  {
    key: 'contract',
    label: FILTER_TYPES.contract,
  },
  {
    key: 'assets',
    label: FILTER_TYPES.assets,
  },
] as const;

function sortTokenOrNFTApprovalsSpenderList(
  item: Record<string, TokenApprovalItem> | Record<string, NftApprovalItem>
) {
  Object.keys(item).forEach((t) => {
    item[t].list
      .sort((a, b) => b.value - a.value)
      .sort((a, b) => {
        const numMap: Record<string, number> = {
          safe: 1,
          warning: 10,
          danger: 100,
        };
        return numMap[b.risk_level] - numMap[a.risk_level];
      });
  });
}

const resetTableRenderer = (
  ref: React.MutableRefObject<VariableSizeGrid | null>
) => {
  if (ref.current) {
    ref.current.scrollToItem({ columnIndex: 0 });
    // ref.current.resetAfterRowIndex(0, true);
    ref.current.resetAfterIndices({
      columnIndex: 0,
      rowIndex: 0,
      shouldForceUpdate: true,
    });
  }
};

export function useApprovalsPage() {
  const { preferences } = usePreference();

  const { currentAccount, fetchCurrentAccount } = useCurrentAccount();

  const chain = useMemo(() => {
    return (
      preferences.tokenApprovalChain[
        currentAccount?.address?.toLowerCase() || ''
      ] || CHAINS_ENUM.ETH
    );
  }, [preferences.tokenApprovalChain, currentAccount?.address]);

  const [filterType, setFilterType] =
    useState<keyof typeof FILTER_TYPES>('contract');

  const [skContracts, setSKContracts] = useState('');
  const [skAssets, setSKAssets] = useState('');
  const vGridRefContracts = useRef<VariableSizeGrid>(null);
  const vGridRefAsset = useRef<VariableSizeGrid>(null);

  const setSearchKw = useMemo(
    () => (filterType === 'contract' ? setSKContracts : setSKAssets),
    [filterType]
  );
  const searchKw = useMemo(
    () => (filterType === 'contract' ? skContracts : skAssets),
    [filterType, skContracts, skAssets]
  );

  const debouncedSearchKw = useDebounceValue(searchKw, 250);

  useLayoutEffect(() => {
    const vGridRef =
      filterType === 'contract' ? vGridRefContracts : vGridRefAsset;
    if (vGridRef.current) {
      vGridRef.current?.scrollToItem({ columnIndex: 0 });
      vGridRef.current?.resetAfterColumnIndex(0, true);
    }
  }, [debouncedSearchKw, filterType]);

  const queueRef = useRef(new PQueue({ concurrency: 40 }));

  const [{ value: allData, loading, error: loadError }, loadData] =
    useAsyncFn(async () => {
      const contractMap: Record<string, ContractApprovalItem> = {};
      const tokenMap: Record<string, TokenApprovalItem> = {};
      const nftMap: Record<string, NftApprovalItem> = {};

      if (!currentAccount?.address) {
        return [contractMap, tokenMap, nftMap];
      }
      const userAddress = currentAccount.address;
      const usedChainList = await walletOpenapi.usedChainList(userAddress);

      await queueRef.current.clear();
      const nftAuthorizedQueryList = usedChainList.map((e) => async () => {
        try {
          const data = await walletOpenapi.userNFTAuthorizedList(
            userAddress,
            e.id
          );
          if (data.total) {
            data.contracts.forEach((contract: NFTApprovalContract) => {
              const chainName = contract.chain;
              const contractId = contract.spender.id;
              const spender = contract.spender;

              if (!contractMap[`${chainName}:${contractId}`]) {
                const $riskAboutValues = makeComputedRiskAboutValues(
                  'nft-contract',
                  spender
                );
                contractMap[`${chainName}:${contractId}`] = {
                  list: [],
                  chain: e.id,
                  type: 'contract',
                  contractFor: 'nft-contract',
                  $riskAboutValues,
                  $contractRiskEvaluation: getContractRiskEvaluation(
                    spender.risk_level,
                    $riskAboutValues
                  ),
                  risk_level: spender.risk_level,
                  risk_alert: spender.risk_alert,
                  id: spender.id,
                  name: spender?.protocol?.name || 'Unknown',
                  logo_url: spender.protocol?.logo_url,
                };
              }
              contractMap[`${chainName}:${contractId}`].list.push(contract);

              if (!nftMap[`${chainName}:${contract.contract_id}`]) {
                nftMap[`${chainName}:${contract.contract_id}`] = {
                  nftContract: contract,
                  list: [],
                  type: 'nft',
                  $riskAboutValues: makeComputedRiskAboutValues(
                    'nft-contract',
                    spender
                  ),
                  risk_level: 'safe',
                  id: contract.contract_id,
                  name: contract.contract_name,
                  logo_url:
                    (contract as any)?.collection?.logo_url || IconUnknownNFT,
                  amount: contract.amount,
                  chain: e.id,
                };
              }
              nftMap[`${chainName}:${contract.contract_id}`].list.push(
                markParentForAssetItemSpender(
                  spender,
                  nftMap[`${chainName}:${contract.contract_id}`],
                  contractMap[`${chainName}:${contractId}`],
                  contract
                )
              );
            });

            data.tokens.forEach((token) => {
              const chainName = token.chain;
              const contractId = token.spender.id;
              const spender = token.spender;

              if (!contractMap[`${token.chain}:${contractId}`]) {
                const $riskAboutValues = makeComputedRiskAboutValues(
                  'nft',
                  spender
                );
                contractMap[`${token.chain}:${contractId}`] = {
                  list: [],
                  chain: e.id,
                  risk_level: spender.risk_level,
                  risk_alert: spender.risk_alert,
                  id: spender.id,
                  name: spender?.protocol?.name || 'Unknown',
                  logo_url: spender.protocol?.logo_url || IconUnknownNFT,
                  type: 'contract',
                  contractFor: 'nft',
                  $riskAboutValues,
                  $contractRiskEvaluation: getContractRiskEvaluation(
                    spender.risk_level,
                    $riskAboutValues
                  ),
                };
              }
              contractMap[`${chainName}:${contractId}`].list.push(token);

              const nftTokenKey = `${chainName}:${token.contract_id}:${token.inner_id}`;
              if (!nftMap[nftTokenKey]) {
                nftMap[nftTokenKey] = {
                  nftToken: token,
                  list: [],
                  chain: e.id,
                  risk_level: 'safe',
                  id: token.contract_id,
                  name: token.contract_name,
                  logo_url:
                    token?.content || (token as any).collection?.logo_url,
                  type: 'nft',
                  $riskAboutValues: makeComputedRiskAboutValues('nft', spender),
                  amount: token.amount,
                };
              }
              nftMap[nftTokenKey].list.push(
                markParentForAssetItemSpender(
                  spender,
                  nftMap[nftTokenKey],
                  contractMap[`${chainName}:${contractId}`],
                  token
                )
              );
            });
          }
        } catch (error) {
          console.error('fetch userNFTAuthorizedList error', error);
        }
      });

      const tokenAuthorizedQueryList = usedChainList.map((e) => async () => {
        try {
          const data = await walletOpenapi.tokenAuthorizedList(
            userAddress,
            e.id
          );
          if (data.length) {
            data.forEach((token) => {
              token.spenders.forEach((spender) => {
                const chainName = token.chain;
                const contractId = spender.id;
                if (!contractMap[`${chainName}:${contractId}`]) {
                  const $riskAboutValues = makeComputedRiskAboutValues(
                    'token',
                    spender
                  );
                  contractMap[`${chainName}:${contractId}`] = {
                    list: [],
                    chain: token.chain,
                    risk_level: spender.risk_level,
                    risk_alert: spender.risk_alert,
                    id: spender.id,
                    name: spender?.protocol?.name || 'Unknown',
                    logo_url: spender.protocol?.logo_url,
                    type: 'contract',
                    contractFor: 'token',
                    $riskAboutValues,
                    $contractRiskEvaluation: getContractRiskEvaluation(
                      spender.risk_level,
                      $riskAboutValues
                    ),
                  };
                }
                contractMap[`${chainName}:${contractId}`].list.push(token);

                const tokenId = token.id;

                if (!tokenMap[`${chainName}:${tokenId}`]) {
                  tokenMap[`${chainName}:${tokenId}`] = {
                    list: [],
                    chain: e.id,
                    risk_level: 'safe',
                    id: token.id,
                    name: token.symbol,
                    logo_url: token.logo_url || IconUnknownToken,
                    type: 'token',
                    $riskAboutValues: makeComputedRiskAboutValues(
                      'token',
                      spender
                    ),
                    balance: token.balance,
                  };
                }
                tokenMap[`${chainName}:${tokenId}`].list.push(
                  markParentForAssetItemSpender(
                    spender,
                    tokenMap[`${chainName}:${tokenId}`],
                    contractMap[`${chainName}:${contractId}`],
                    token
                  )
                );
              });
            });
          }
        } catch (error) {
          console.error('fetch tokenAuthorizedList error:', error);
        }
      });
      await queueRef.current.addAll([
        ...nftAuthorizedQueryList,
        ...tokenAuthorizedQueryList,
      ]);

      sortTokenOrNFTApprovalsSpenderList(tokenMap);
      sortTokenOrNFTApprovalsSpenderList(nftMap);

      return [contractMap, tokenMap, nftMap];
    }, [currentAccount?.address]);

  const loadApprovals = useCallback(async () => {
    await loadData();

    setTimeout(() => {
      resetTableRenderer(vGridRefContracts);
      resetTableRenderer(vGridRefAsset);
    }, 200);
  }, [loadData]);

  const [contractMap, tokenMap, nftMap] = allData || [];

  if (loadError) {
    console.log('loadError', loadError);
  }

  const sortedContractList: ContractApprovalItem[] = useMemo(() => {
    if (contractMap) {
      const contractMapArr = Object.values(contractMap);
      const l = contractMapArr.length;
      const dangerList: ContractApprovalItem[] = [];
      const warnList: ContractApprovalItem[] = [];
      const safeList: ContractApprovalItem[] = [];
      const numMap: Record<string, string> = {
        safe: 'safe',
        warning: 'warning',
        danger: 'danger',
      };
      for (let i = 0; i < l; i++) {
        const item = contractMapArr[i];
        if (item.risk_level === numMap.warning) {
          warnList.push(item);
        } else if (item.risk_level === numMap.danger) {
          dangerList.push(item);
        } else {
          safeList.push(item);
        }
      }

      const groupedSafeList = groupBy(safeList, (item) => item.chain);
      const sorted = sortBy(Object.values(groupedSafeList), 'length');
      const sortedList = sorted.map((e) =>
        sortBy(e, (a) => a.list.length).reverse()
      );
      return [...dangerList, ...warnList, ...flatten(sortedList.reverse())];
    }
    return [];
  }, [contractMap]);

  const sortedAssetstList = useMemo(() => {
    const assetsList = [
      ...flatten(
        Object.values(tokenMap || {}).map(
          (item: TokenApprovalItem) => item.list
        )
      ),
      ...flatten(Object.values(nftMap || {}).map((item) => item.list)),
    ] as AssetApprovalItem['list'][number][];

    return assetsList;
    // return [...dangerList, ...warnList, ...flatten(sortedList.reverse())];
  }, [tokenMap, nftMap]);

  const { displaySortedContractList, displaySortedAssetsList } = useMemo(() => {
    if (!debouncedSearchKw || debouncedSearchKw.trim() === '') {
      return {
        displaySortedContractList: sortedContractList,
        displaySortedAssetsList: sortedAssetstList,
      };
    }

    const keywords = debouncedSearchKw.toLowerCase();
    return {
      displaySortedContractList: sortedContractList.filter((e) => {
        return [e.id, e.risk_alert || '', e.name, e.id, e.chain].some((i) =>
          i.toLowerCase().includes(keywords)
        );
      }),
      displaySortedAssetsList: sortedAssetstList.filter((e) => {
        return [
          e.id,
          e.risk_alert || '',
          e.$assetParent?.name,
          e.id,
          e.$assetParent?.chain,
        ].some((i) => i?.toLowerCase().includes(keywords));
      }),
    };
  }, [sortedAssetstList, sortedContractList, debouncedSearchKw]);

  useEffect(() => {
    loadApprovals();

    const listener = () => {
      fetchCurrentAccount();
    };

    eventBus.addEventListener('accountsChanged', listener);

    return () => {
      eventBus.removeEventListener('accountsChanged', listener);
    };
  }, [loadApprovals, fetchCurrentAccount]);

  return {
    isLoading: loading,
    loadData,
    loadApprovals,
    searchKw,
    debouncedSearchKw,
    setSearchKw,

    filterType,
    setFilterType,

    vGridRefContracts,
    vGridRefAsset,

    chain,
    displaySortedContractList,
    displaySortedAssetsList,
  };
}
