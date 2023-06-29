import { DisplayProtocol } from '@/renderer/hooks/useHistoryProtocol';
import { ServerChain, TokenItem } from '@rabby-wallet/rabby-api/dist/types';
import BigNumber from 'bignumber.js';
import { sortBy } from 'lodash';
import { useMemo, useState } from 'react';
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
  selectChainServerId: string | null
) => {
  const filterTokenList = useMemo(() => {
    const list: TokenItem[] = selectChainServerId
      ? tokenList.filter((token) => token.chain === selectChainServerId)
      : tokenList;
    return sortBy(list, (i) => i.usd_value || 0).reverse();
  }, [tokenList, selectChainServerId]);

  return filterTokenList;
};
export const useFilterProtoList = (
  protocolList: DisplayProtocol[],
  selectChainServerId: string | null
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
          item.portfolio_item_list = item.portfolio_item_list.map((i) => {
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
      ),
      (i) => i.usd_value || 0
    ).reverse();
  }, [protocolList, selectChainServerId]);

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
