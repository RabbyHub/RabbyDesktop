import React from 'react';
import { useBundle } from '@/renderer/hooks/useBundle/useBundle';
import clsx from 'clsx';
import { formatNumber } from '@/renderer/utils/number';
import { Skeleton } from 'antd';
import ChainList from '../../Home/components/ChainList';
import PortfolioView from '../../Home/components/PortfolioView';
import {
  useFilterTokenList,
  useFilterProtoList,
  useExpandList,
  useExpandProtocolList,
} from '../../Home/hooks';
import { VIEW_TYPE } from '../../Home/type';
import { UpdateButton } from '../../Home/components/UpdateButton';

export const LeftContainer: React.FC = () => {
  const [selectChainServerId, setSelectChainServerId] = React.useState<
    string | null
  >(null);
  const {
    loadingToken,
    loadingProtocol,
    loadingUsedChain,
    bundleBalance,
    bundleChainList,
    bundleTokenList,
    bundleProtocolList,
    refetchBundleAssets,
  } = useBundle();

  const filterTokenList = useFilterTokenList(
    bundleTokenList,
    selectChainServerId
  );
  const filterProtocolList = useFilterProtoList(
    bundleProtocolList,
    selectChainServerId
  );
  const {
    filterList: displayTokenList,
    isShowExpand: isShowTokenExpand,
    isExpand: isTokenExpand,
    totalHidden: tokenHiddenUsdValue,
    totalHiddenCount: tokenHiddenCount,
    setIsExpand: setIsTokenExpand,
    usdValueChange: expandTokensUsdValueChange,
  } = useExpandList(filterTokenList, null, []);
  const {
    filterList: displayProtocolList,
    isShowExpand: isShowProtocolExpand,
    isExpand: isProtocolExpand,
    totalHidden: protocolHiddenUsdValue,
    totalHiddenCount: protocolHiddenCount,
    setIsExpand: setIsProtocolExpand,
  } = useExpandProtocolList(filterProtocolList);

  return (
    <div
      className={clsx(
        'text-white pl-[28px] overflow-hidden h-full',
        'flex flex-col'
      )}
    >
      <div className="relative mb-[23px]">
        <h2
          className={clsx(
            'text-white text-[14px] opacity-70 leading-[17px]',
            'mb-[20px]'
          )}
        >
          Combined Asset Value
        </h2>
        <div className={clsx('text-[46px] font-medium leading-none')}>
          {loadingProtocol && loadingToken ? (
            <Skeleton.Input
              active
              className="w-[234px] h-[46px] rounded-[2px]"
            />
          ) : (
            <span className="block">${formatNumber(bundleBalance)}</span>
          )}
        </div>

        <div className="absolute right-0 bottom-0">
          <UpdateButton
            loading={loadingProtocol || loadingToken}
            onUpdate={refetchBundleAssets}
          />
        </div>
      </div>
      <section className="mt-[-3px] overflow-auto flex-1 pb-[20px]">
        <div className="mb-[20px]">
          {loadingUsedChain && loadingToken ? (
            <Skeleton.Input active className="w-full h-[88px] rounded-[2px]" />
          ) : (
            <ChainList
              chainBalances={bundleChainList}
              onChange={setSelectChainServerId}
            />
          )}
        </div>

        <PortfolioView
          tokenList={displayTokenList}
          protocolList={displayProtocolList}
          selectChainServerId={selectChainServerId}
          chainList={bundleChainList}
          historyTokenMap={{}}
          historyProtocolMap={{}}
          protocolHistoryTokenPriceMap={{}}
          tokenHidden={{
            isExpand: isTokenExpand,
            hiddenCount: tokenHiddenCount,
            hiddenUsdValue: tokenHiddenUsdValue,
            expandTokensUsdValueChange,
            setIsExpand: setIsTokenExpand,
            isShowExpand: isShowTokenExpand,
          }}
          protocolHidden={{
            isShowExpand: isShowProtocolExpand,
            isExpand: isProtocolExpand,
            hiddenCount: protocolHiddenCount,
            hiddenUsdValue: protocolHiddenUsdValue,
            setIsExpand: setIsProtocolExpand,
          }}
          isLoadingTokenList={loadingToken}
          isLoadingProtocolList={loadingProtocol}
          isLoadingProtocolHistory={false}
          supportHistoryChains={[]}
          historyTokenDict={{}}
          view={VIEW_TYPE.DEFAULT}
        />
      </section>
    </div>
  );
};
