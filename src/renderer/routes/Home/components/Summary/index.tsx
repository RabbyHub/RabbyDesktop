import { isNil } from 'lodash';
import { TipsWrapper } from '@/renderer/components/TipWrapper';
import { formatAmount, formatUsdValue } from '@/renderer/utils/number';
import { ellipsisTokenSymbol } from '@/renderer/utils/token';
import clsx from 'clsx';
import { MINI_ASSET_ID, MINI_DEBT_ID } from './assets';
// import { LoadingProtocolItem } from '../HistoryProtocolItem';
import { useGetSummaryInfo } from './hook';
import { LoadingSummaryItem } from './Loading';

export const Summary = () => {
  const { loading, summary } = useGetSummaryInfo();
  if (loading) {
    return <LoadingSummaryItem />;
  }
  return (
    <div className="px-2">
      <div className="inline-flex w-full mb-[14px] text-[#fff] opacity-80 px-12">
        <div className="w-[22%]">Asset</div>
        <div className="w-[16%]">Price</div>
        <div className="w-[22%]">Amount</div>
        <div className="w-[16%]">USD Value</div>
        <div className="w-[24%] flex items-center gap-4">
          <span>Percent </span>
          <TipsWrapper hoverTips="Asset value divided by total net worth">
            <img
              className="w-12 h-12"
              src="rabby-internal://assets/icons/home/info.svg"
            />
          </TipsWrapper>
        </div>
      </div>
      {summary.map((e) => {
        const isSmallAssets = [MINI_ASSET_ID, MINI_DEBT_ID].includes(e.id);
        const smallAssetsClass =
          'font-normal text-12 text-[#fff] text-opacity-50';
        return (
          <li
            className={clsx(
              'w-full h-[64px] inline-flex items-center text-15 font-medium',
              'hover:bg-[#000] hover:bg-opacity-[0.06] rounded-[6px] px-12'
            )}
            key={e.id}
          >
            <div
              className={clsx(
                'w-[22%] flex items-center',
                isSmallAssets && smallAssetsClass
              )}
            >
              <img
                src={
                  isSmallAssets
                    ? 'rabby-internal://assets/icons/home/hide-assets.svg'
                    : e.logo_url ||
                      'rabby-internal://assets/icons/common/token-default.svg'
                }
                className="w-24 h-24 rounded-full mr-18"
              />
              <span className="font-bold">
                {isSmallAssets ? e.symbol : ellipsisTokenSymbol(e.symbol)}
              </span>
              {e.amount < 0 ? (
                <div className="ml-2 rounded-[4px] text-[10px] px-6 py-2 text-[#FE815F] border-solid border border-[#FE815F]">
                  DEBT
                </div>
              ) : null}
            </div>
            <div className={clsx('w-[16%]', isSmallAssets && smallAssetsClass)}>
              {isNil(e.price) ? '-' : formatUsdValue(e.price || 0)}
            </div>
            <div className={clsx('w-[22%]', isSmallAssets && smallAssetsClass)}>
              {isNil(e.amount) ? '-' : formatAmount(Math.abs(e.amount || 0))}{' '}
              {isNil(e.amount) ? '' : e.symbol}
            </div>
            <div className="w-[16%]">{e._netWorth}</div>
            <div className="w-[24%] relative h-[44px]">
              <div
                className={clsx(
                  'h-[44px] bg-opacity-30 rounded-[4px]',
                  e._value > 0 ? 'bg-[#4AEBBB]' : 'bg-[#FF6565]'
                )}
                style={{ width: `${e._percent}%` }}
              />
              <div className="absolute top-0 left-0 right-0 bottom-0 flex items-center pl-14 text-14 text-white text-opacity-90">
                {e._percent.toFixed(2)}%
              </div>
            </div>
          </li>
        );
      })}
      {!loading && summary.length && (
        <div className="text-14 text-[#fff] text-opacity-50 mt-[22px] pl-12">
          All assets in protocols (e.g. LP tokens) are resolved to the
          underlying assets for statistical calculations
        </div>
      )}
    </div>
  );
};
