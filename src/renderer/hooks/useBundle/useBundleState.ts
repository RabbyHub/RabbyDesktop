import React from 'react';
import { sortBy } from 'lodash';
import { useBTC } from './useBTC';
import { useBundleAccount } from './useBundleAccount';
import { useETH } from './useETH';
import { bigNumberSum } from './util';
import { useCex } from './useCex/useCex';

let lastUpdatedKey = '';

/**
 * - 地址列表
 *  - 返回所有类型的地址：eth btc bn okx
 *  - 新增地址
 *  - 删除地址
 *  - 修改备注
 * - 返回所有链的余额
 * - 返回所有 token 的余额
 * - 返回所有资产
 *  - eth 的汇总
 *  - bn 的汇总
 *  - okx 的汇总
 */
export const useBundleState = () => {
  const account = useBundleAccount();
  const eth = useETH();
  const btc = useBTC();
  const { cexList, ...cexInstances } = useCex();

  const updatedKey = JSON.stringify(account.inBundleList.map((acc) => acc.id));

  const hasEthAccount = React.useMemo(
    () => account.inBundleList.some((acc) => acc.type === 'eth'),
    [account.inBundleList]
  );
  const hasBtcAccount = React.useMemo(
    () => account.inBundleList.some((acc) => acc.type === 'btc'),
    [account.inBundleList]
  );

  const getAllAssets = (force = false) => {
    eth.getAssets(force);
    btc.getAssets(force);
    cexList.forEach((cex) => {
      cex.instance.getAssets(force);
    });
  };

  const refetchBundleAssets = () => {
    getAllAssets(true);
  };

  // 链列表
  const bundleChainList = React.useMemo(() => {
    const list = [];
    if (hasEthAccount) {
      list.push(...eth.displayChainList);
    }

    if (hasBtcAccount) {
      list.push(btc.chainData);
    }

    cexList.forEach((cex) => {
      if (cex.hasAccount) {
        list.push(cex.instance.chainData);
      }
    });

    return sortBy(list, (item) => item.usd_value).reverse();
  }, [
    hasEthAccount,
    hasBtcAccount,
    cexList,
    eth.displayChainList,
    btc.chainData,
  ]);

  const bundleBalance = React.useMemo(() => {
    return (
      bigNumberSum(
        eth.balance,
        btc.balance,
        ...cexList.map((cex) => cex.instance.balance)
      ) ?? '0'
    );
  }, [eth.balance, btc.balance, cexList]);

  // token 列表
  const bundleTokenList = React.useMemo(() => {
    const list = [];
    if (hasEthAccount) {
      list.push(...eth.tokenList);
    }
    if (hasBtcAccount && btc.tokenData) {
      list.push(btc.tokenData);
    }
    return list;
  }, [btc.tokenData, eth.tokenList, hasBtcAccount, hasEthAccount]);

  // 资产列表
  const bundleProtocolList = React.useMemo(() => {
    const list = [];
    if (hasEthAccount) {
      list.push(...eth.protocolList);
    }
    cexList.forEach((cex) => {
      if (cex.hasAccount && cex.instance.protocolData) {
        list.push(cex.instance.protocolData);
      }
    });

    return list;
  }, [cexList, eth.protocolList, hasEthAccount]);

  // update when account list changed
  React.useEffect(() => {
    if (lastUpdatedKey === updatedKey) {
      return;
    }
    getAllAssets();
    lastUpdatedKey = updatedKey;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [updatedKey]);

  const loadingToken = eth.loadingToken || btc.loading;
  const loadingProtocol =
    eth.loadingProtocol || cexList.some((cex) => cex.instance.loading);
  const loadingUsedChain =
    eth.loadingUsedChain ||
    btc.loading ||
    cexList.some((cex) => cex.instance.loading);

  return {
    refetchBundleAssets,
    bundleChainList,
    bundleBalance,
    bundleTokenList,
    bundleProtocolList,
    account,
    eth,
    btc,
    loadingToken,
    loadingProtocol,
    loadingUsedChain,
    ...cexInstances,
  };
};
