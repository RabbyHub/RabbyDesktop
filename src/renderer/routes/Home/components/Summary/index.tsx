import { isNil } from 'lodash';
import { TipsWrapper } from '@/renderer/components/TipWrapper';
import { formatAmount, formatUsdValue } from '@/renderer/utils/number';
import { ellipsisTokenSymbol } from '@/renderer/utils/token';
import clsx from 'clsx';
import { MINI_ASSET_ID, MINI_DEBT_ID } from './assets';
import { useGetSummaryInfo } from './hook';
import { SummaryLoading } from './Loading';

export const Summary = () => {
  const { loading, summary } = useGetSummaryInfo();

  return (
    <div className="px-2 leading-[0]">
      <div className="inline-flex w-full mb-[15px] px-12 text-12 leading-[1] text-white text-opacity-50">
        <div className="w-[22%] text-white text-opacity-80 font-medium">
          Asset
        </div>
        <div className="w-[16%]">Price</div>
        <div className="w-[22%]">Amount</div>
        <div className="w-[16%]">USD Value</div>
        <div className="w-[24%] flex items-center gap-4">
          <span>Percent </span>
          <TipsWrapper hoverTips="Asset value divided by total net worth">
            <img
              className="w-12 h-12 opacity-50"
              src="rabby-internal://assets/icons/home/info.svg"
            />
          </TipsWrapper>
        </div>
      </div>
      {loading && <SummaryLoading />}

      {!loading &&
        summary?.map((e) => {
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
                <span
                  className={clsx(
                    isSmallAssets
                      ? 'text-12 text-[#9094a1] font-normal'
                      : 'font-bold'
                  )}
                >
                  {isSmallAssets ? e.symbol : ellipsisTokenSymbol(e.symbol)}
                </span>
                {e.amount < 0 ? (
                  <div className="ml-[5px] rounded-[4px] text-[10px] font-bold leading-[12px] px-[5px] py-2 text-[#ff6565] border-solid border border-[#ff6565]">
                    DEBT
                  </div>
                ) : null}
              </div>
              <div
                className={clsx('w-[16%]', isSmallAssets && smallAssetsClass)}
              >
                {isNil(e.price) ? '-' : formatUsdValue(e.price || 0)}
              </div>
              <div
                className={clsx('w-[22%]', isSmallAssets && smallAssetsClass)}
              >
                {isNil(e.amount) ? '-' : formatAmount(Math.abs(e.amount || 0))}{' '}
                {isNil(e.amount) ? '' : e.symbol}
              </div>
              <div className="w-[16%]">
                {formatUsdValue(Math.abs(e._value))}
              </div>
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

      {!loading && !!summary.length && (
        <div className="text-12 text-[#9094a1] font-normal  mt-[22px] pl-12">
          All assets in protocols (e.g. LP tokens) are resolved to the
          underlying assets for statistical calculations
        </div>
      )}
    </div>
  );
};
