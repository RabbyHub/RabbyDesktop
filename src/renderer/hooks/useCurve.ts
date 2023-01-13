import { useCallback } from 'react';
import { formatNumber } from '@/renderer/utils/number';

type CurveList = Array<{ timestamp: number; usd_value: number }>;

const formChartData = (
  data: CurveList,
  realtimeNetWorth = 0,
  realtimeTimestamp?: number
) => {
  const startData = data[0] || { value: 0, timestamp: 0 };

  const list =
    data?.map((x) => {
      const change = x.usd_value - startData.usd_value;

      return {
        value: x.usd_value || 0,
        netWorth: x.usd_value ? `$${formatNumber(x.usd_value, 0)}` : '$0',
        change: `$${formatNumber(Math.abs(change))}`,
        isLoss: change < 0,
        changePercent:
          startData.usd_value === 0
            ? `${x.usd_value === 0 ? '0' : '100.00'}%`
            : `${(Math.abs(change * 100) / startData.usd_value).toFixed(2)}%`,
        timestamp: x.timestamp,
      };
    }) || [];

  // patch realtime newworth
  if (realtimeTimestamp) {
    const realtimeChange = realtimeNetWorth - startData.usd_value;

    list.push({
      value: realtimeNetWorth || 0,
      netWorth: realtimeNetWorth ? `$${formatNumber(realtimeNetWorth)}` : '$0',
      change: `${formatNumber(Math.abs(realtimeChange))}`,
      isLoss: realtimeChange < 0,
      changePercent:
        startData.usd_value === 0
          ? `${realtimeNetWorth === 0 ? '0' : '100.00'}%`
          : `${(Math.abs(realtimeChange * 100) / startData.usd_value).toFixed(
              2
            )}%`,
      timestamp: Math.floor(realtimeTimestamp / 1000),
    });
  }

  const endNetWorth = list?.length ? list[list.length - 1]?.value : 0;
  const assetsChange = endNetWorth - startData.usd_value;
  const isEmptyAssets = endNetWorth === 0 && startData.usd_value === 0;

  return {
    list,
    netWorth: endNetWorth === 0 ? '$0' : `$${formatNumber(endNetWorth)}`,
    change: `$${formatNumber(Math.abs(assetsChange))}`,
    changePercent:
      startData.usd_value !== 0
        ? `${Math.abs((assetsChange * 100) / startData.usd_value).toFixed(2)}%`
        : `${endNetWorth === 0 ? '0' : '100.00'}%`,
    isLoss: assetsChange < 0,
    isEmptyAssets,
  };
};

export default (
  realtimeNetWorth: number,
  realtimeTimestamp: number,
  data: CurveList
) => {
  const select = useCallback(
    () => formChartData(data, realtimeNetWorth, realtimeTimestamp),
    [realtimeNetWorth, realtimeTimestamp, data]
  );
  return select();
};
