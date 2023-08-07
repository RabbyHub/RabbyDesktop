import { DisplayProtocol } from '@/renderer/hooks/useHistoryProtocol';
import { ServerChain, TokenItem } from '@rabby-wallet/rabby-api/dist/types';
import BigNumber from 'bignumber.js';
import { sortBy } from 'lodash';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { walletOpenapi } from '@/renderer/ipcRequest/rabbyx';
import { useToken } from '@/renderer/hooks/rabbyx/useToken';
import { isSameAddress } from '@/renderer/utils/address';
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
  const { totalHidden, totalHiddenCount } = useMemo(() => {
    if (!isShowExpand) {
      return {
        totalHidden: 0,
        totalHiddenCount: 0,
      };
    }
    return {
      totalHidden: tokens.reduce((t, item) => {
        const price = item.amount * item.price || 0;
        if (price < filterPrice) {
          return t + price;
        }
        return t;
      }, 0),
      totalHiddenCount: tokens.filter((item) => {
        const price = item.amount * item.price || 0;
        return price < filterPrice;
      }).length,
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
  };
};

export const useFilterTokenList = (
  tokenList: TokenItem[],
  selectChainServerId: string | null,
  currentAddress?: string,
  query?: string,
  withBalance = false
) => {
  const [searchList, setSearchList] = useState<TokenItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const currentList = query ? searchList : tokenList;
  const filterTokenList = useMemo(() => {
    const list: TokenItem[] = selectChainServerId
      ? currentList.filter((token) => token.chain === selectChainServerId)
      : currentList;
    return sortBy(list, (i) => i.usd_value || 0).reverse();
  }, [currentList, selectChainServerId]);
  const { customize, blocked } = useToken({ tokenList });
  const addressRef = useRef(currentAddress);
  const kwRef = useRef<string>();

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
      const matchCustomTokens = customize?.filter((token) => {
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
            const isBlocked = !!blocked.find((b) =>
              isSameAddress(b.id, item.id)
            );
            return !isBlocked;
          })
        );
      }
    },
    [customize, withBalance, blocked]
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

  return { filterTokenList, isLoading };
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
    return sortBy(
      sortBy(
        list.map((item) => {
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
                  reg.test(token.display_symbol || '') || reg.test(token.symbol)
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
      ).filter((item) => item.portfolio_item_list.length > 0),
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
