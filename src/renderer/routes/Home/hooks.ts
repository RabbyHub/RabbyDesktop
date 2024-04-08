import { DisplayProtocol } from '@/renderer/hooks/useHistoryProtocol';
import { ServerChain, TokenItem } from '@rabby-wallet/rabby-api/dist/types';
import BigNumber from 'bignumber.js';
import { cloneDeep, sortBy } from 'lodash';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { walletController, walletOpenapi } from '@/renderer/ipcRequest/rabbyx';
import { useTokenAtom } from '@/renderer/hooks/rabbyx/useToken';
import { isSameAddress } from '@/renderer/utils/address';
import { CHAINS } from '@debank/common';
import { findChainByEnum } from '@/renderer/utils';
import { useCurrentAccount } from '@/renderer/hooks/rabbyx/useAccount';
import { checkIsCexProtocol } from '@/renderer/hooks/useBundle/cex/utils/shared';
import { findChain } from '@/renderer/utils/chain';
import { VIEW_TYPE } from './type';

export const useSwitchView = () => {
  const [currentView, setCurrentView] = useState(VIEW_TYPE.DEFAULT);
  const switchView = (view: VIEW_TYPE) => {
    if (currentView === view) return;
    setCurrentView(view);
  };
  return {
    switchView,
    currentView,
  };
};

const calcFilterPrice = (tokens: { usd_value?: number }[]) => {
  const total = tokens.reduce((t, item) => (item.usd_value || 0) + t, 0);
  return Math.min(total * 0.001, 1000);
};
const calcIsShowExpand = (tokens: { usd_value?: number }[]) => {
  const filterPrice = calcFilterPrice(tokens);
  if (tokens.length < 15) {
    return false;
  }
  if (tokens.filter((item) => (item.usd_value || 0) < filterPrice).length < 3) {
    return false;
  }
  return true;
};

export const useExpandList = (
  tokens: TokenItem[],
  historyTokenMap: null | Record<string, TokenItem>,
  supportHistoryChains: ServerChain[]
) => {
  const [isExpand, setIsExpand] = useState(false);
  const filterPrice = useMemo(() => calcFilterPrice(tokens), [tokens]);
  const isShowExpand = useMemo(() => calcIsShowExpand(tokens), [tokens]);
  const { totalHidden, totalHiddenCount, tokenHiddenList } = useMemo(() => {
    if (!isShowExpand) {
      return {
        totalHidden: 0,
        totalHiddenCount: 0,
        tokenHiddenList: [],
      };
    }
    const currentHiddenList = tokens.filter((item) => {
      const price = item.amount * item.price || 0;
      return price < filterPrice;
    });
    return {
      totalHidden: tokens.reduce((t, item) => {
        const price = item.amount * item.price || 0;
        if (price < filterPrice) {
          return t + price;
        }
        return t;
      }, 0),
      tokenHiddenList: currentHiddenList,
      totalHiddenCount: currentHiddenList.length,
    };
  }, [tokens, filterPrice, isShowExpand]);
  const filterList = useMemo(() => {
    if (!isShowExpand) {
      return tokens;
    }
    if (isExpand) {
      return tokens;
    }
    return tokens.filter(
      (item) => (item.amount * item.price || 0) >= filterPrice
    );
  }, [isExpand, tokens, isShowExpand, filterPrice]);
  const omitTokens = tokens.filter(
    (item) => (item.amount * item.price || 0) < filterPrice
  );
  const usdValueChange = historyTokenMap
    ? omitTokens.reduce((sum, item) => {
        const key = `${item.chain}-${item.id}`;
        const history = historyTokenMap[key];
        if (!history) {
          return sum + new BigNumber(item.amount).times(item.price).toNumber();
        }
        if (supportHistoryChains.find((chain) => chain.id === item.chain)) {
          return (
            sum +
            (new BigNumber(item.amount).times(item.price).toNumber() -
              new BigNumber(history.amount).times(history.price).toNumber())
          );
        }
        return (
          sum +
          (new BigNumber(item.amount).times(item.price).toNumber() -
            new BigNumber(item.amount).times(history.price).toNumber())
        );
      }, 0)
    : 0;

  return {
    isExpand,
    setIsExpand,
    filterList,
    filterPrice,
    isShowExpand,
    totalHidden,
    totalHiddenCount,
    usdValueChange,
    tokenHiddenList,
  };
};

const useSortToken = <T extends TokenItem>(list?: T[]) => {
  const [result, setResult] = useState<T[]>([]);
  const { currentAccount } = useCurrentAccount();

  const sortByChainBalance = useCallback(
    async (_list: T[]) => {
      if (currentAccount) {
        const cache = await walletController.getAddressCacheBalance(
          currentAccount.address
        );
        if (cache) {
          _list.sort((a, b) => {
            const chain1 = cache.chain_list.find(
              (chain) => chain.id === a.chain
            );
            const chain2 = cache.chain_list.find(
              (chain) => chain.id === b.chain
            );
            if (chain1 && chain2) {
              if (chain1.usd_value <= 0 && chain2.usd_value <= 0) {
                return (chain2.born_at || 0) - (chain1.born_at || 0);
              }
              return chain2.usd_value - chain1.usd_value;
            }
            return 0;
          });
        }
      }
      return _list;
    },
    [currentAccount]
  );

  useEffect(() => {
    if (!list) return;
    const hasUsdValue: T[] = [];
    const hasAmount: T[] = [];
    const others: T[] = [];
    for (let i = 0; i < list.length; i++) {
      const item = list[i];
      const usdValue = item.price * item.amount;
      if (usdValue > 0) {
        hasUsdValue.push(item);
      } else if (item.amount > 0) {
        hasAmount.push(item);
      } else {
        others.push(item);
      }
    }
    hasUsdValue.sort((a, b) => {
      return b.amount * b.price - a.amount * a.price;
    });
    sortByChainBalance(others).then((_list) => {
      setResult([...hasUsdValue, ...hasAmount, ..._list]);
    });
  }, [list, sortByChainBalance]);

  return result;
};

const filterDisplayToken = (
  tokens: TokenItem[],
  blocked: TokenItem[],
  customize: TokenItem[]
) => {
  const list = tokens.filter((token) => {
    const chain = findChain({
      serverId: token.chain,
    });
    return (
      token.is_core &&
      !blocked.find(
        (item) => isSameAddress(token.id, item.id) && item.chain === token.chain
      ) &&
      findChainByEnum(chain?.enum)
    );
  });

  return [...list, ...customize];
};

export const useFilterTokenList = (
  tokenList: TokenItem[],
  selectChainServerId: string | null,
  currentAddress?: string,
  query?: string,
  withBalance = false
) => {
  const { customize, blocked } = useTokenAtom();
  const fullTokenList = useMemo(() => {
    return filterDisplayToken(tokenList, blocked, customize);
  }, [tokenList, blocked, customize]);
  const [searchList, setSearchList] = useState<TokenItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const currentList = query ? searchList : fullTokenList;
  const filterTokenList = useMemo(() => {
    const list: TokenItem[] = selectChainServerId
      ? currentList.filter((token) => token.chain === selectChainServerId)
      : currentList;

    return list;
  }, [currentList, selectChainServerId]);
  const sortTokenList = useSortToken(filterTokenList);
  const addressRef = useRef(currentAddress);
  const kwRef = useRef<string>();
  const blockedRef = useRef<TokenItem[]>(blocked);
  const customizeRef = useRef<TokenItem[]>(customize);

  const searchToken = useCallback(
    async ({
      address,
      q,
      chainId,
    }: {
      address: string;
      q: string;
      chainId?: string;
    }) => {
      let list: TokenItem[] = [];
      setIsLoading(true);

      if (q.length === 42 && q.toLowerCase().startsWith('0x')) {
        list = await walletOpenapi.searchToken(address, q, chainId, true);
      } else {
        list = await walletOpenapi.searchToken(address, q, chainId);
        if (withBalance) {
          list = list.filter((item) => item.amount > 0);
        }
      }
      const reg = new RegExp(q, 'i');
      const matchCustomTokens = customizeRef.current?.filter((token) => {
        return (
          reg.test(token.name) ||
          reg.test(token.symbol) ||
          reg.test(token.display_symbol || '')
        );
      });
      if (addressRef.current === address && kwRef.current === q) {
        setIsLoading(false);
        setSearchList(
          [...list, ...matchCustomTokens].filter((item) => {
            const isBlocked = !!blockedRef.current?.find((b) =>
              isSameAddress(b.id, item.id)
            );
            return !isBlocked;
          })
        );
      }
    },
    [withBalance]
  );

  useEffect(() => {
    if (!currentAddress || !query) {
      setIsLoading(false);
      return;
    }
    searchToken({
      address: currentAddress,
      q: query,
      chainId: selectChainServerId ?? undefined,
    });
  }, [query, currentAddress, selectChainServerId, searchToken]);

  useEffect(() => {
    addressRef.current = currentAddress;
  }, [currentAddress]);

  useEffect(() => {
    kwRef.current = query;
  }, [query]);

  useEffect(() => {
    blockedRef.current = blocked;
  }, [blocked]);

  useEffect(() => {
    customizeRef.current = customize;
  }, [customize]);

  return {
    filterTokenList: sortTokenList,
    isLoading,
  };
};
export const useFilterProtoList = (
  protocolList: DisplayProtocol[],
  selectChainServerId: string | null,
  query = ''
) => {
  const filterProtocolList = useMemo(() => {
    const list: DisplayProtocol[] = selectChainServerId
      ? protocolList.filter(
          (protocol) => protocol.chain === selectChainServerId
        )
      : protocolList;
    const newList = cloneDeep(list);
    return sortBy(
      sortBy(
        newList.map((item) => {
          if (query) {
            item.portfolio_item_list = item.portfolio_item_list
              .filter((portfolio) => {
                const hasToken = portfolio.asset_token_list.some((token) => {
                  if (
                    query.length === 42 &&
                    query.toLowerCase().startsWith('0x')
                  ) {
                    return isSameAddress(token.id, query);
                  }
                  const reg = new RegExp(query, 'i');
                  return (
                    reg.test(token.display_symbol || '') ||
                    reg.test(token.symbol)
                  );
                });
                return hasToken;
              })
              .map((i) => {
                const assetList = i.asset_token_list;
                let positiveList: TokenItem[] = [];
                let negativeList: TokenItem[] = [];
                assetList.forEach((j) => {
                  if (j.amount < 0) {
                    negativeList.push(j);
                  } else {
                    positiveList.push(j);
                  }
                });
                positiveList = sortBy(
                  positiveList,
                  (j) => j.amount * j.price
                ).reverse();
                negativeList = sortBy(
                  negativeList,
                  (j) => Math.abs(j.amount) * j.price
                ).reverse();
                return {
                  ...i,
                  asset_token_list: [...positiveList, ...negativeList],
                };
              });
          }
          return {
            ...item,
            portfolio_item_list: sortBy(item.portfolio_item_list, (i) => {
              return (i.asset_token_list || []).reduce(
                (sum, j) => sum + j.price * j.amount,
                0
              );
            }).reverse(),
          };
        })
      ).filter((item) => {
        if (checkIsCexProtocol(item.chain)) {
          return true;
        }
        return item.portfolio_item_list.length > 0;
      }),
      (i) => i.usd_value || 0
    ).reverse();
  }, [protocolList, query, selectChainServerId]);

  return filterProtocolList;
};
export const useExpandProtocolList = (protocols: DisplayProtocol[]) => {
  const [isExpand, setIsExpand] = useState(false);
  const filterPrice = useMemo(() => calcFilterPrice(protocols), [protocols]);
  const isShowExpand = useMemo(() => calcIsShowExpand(protocols), [protocols]);
  const { totalHidden, totalHiddenCount } = useMemo(() => {
    return {
      totalHidden: protocols.reduce((t, item) => {
        const price = item.usd_value || 0;
        if (price < filterPrice) {
          return t + price;
        }
        return t;
      }, 0),
      totalHiddenCount: protocols.filter((item) => {
        const price = item.usd_value || 0;
        return price < filterPrice;
      }).length,
    };
  }, [protocols, filterPrice]);
  const filterList = useMemo(() => {
    if (!isShowExpand) {
      return protocols;
    }
    const result = isExpand
      ? protocols
      : protocols.filter((item) => (item.usd_value || 0) >= filterPrice);
    return result;
  }, [isExpand, protocols, isShowExpand, filterPrice]);

  return {
    isExpand,
    setIsExpand,
    filterList,
    filterPrice,
    isShowExpand,
    totalHidden,
    totalHiddenCount,
  };
};
