import { useCallback, useEffect, useState } from 'react';
import { formatNumber, formatUsdValue } from '@/renderer/utils/number';
import { requestOpenApiWithChainId } from '@/main/utils/openapi';
import { walletOpenapi } from '../ipcRequest/rabbyx';

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
        netWorth: x.usd_value ? `${formatUsdValue(x.usd_value)}` : '$0',
        change: `${formatUsdValue(Math.abs(change))}`,
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
    netWorth: endNetWorth === 0 ? '$0' : `${formatUsdValue(endNetWorth)}`,
    change: `${formatUsdValue(Math.abs(assetsChange))}`,
    changePercent:
      startData.usd_value !== 0
        ? `${Math.abs((assetsChange * 100) / startData.usd_value).toFixed(2)}%`
        : `${endNetWorth === 0 ? '0' : '100.00'}%`,
    isLoss: assetsChange < 0,
    isEmptyAssets,
  };
};

export default (
  address: string | undefined,
  nonce: number,
  isTestnet = false
) => {
  const [data, setData] = useState<
    {
      timestamp: number;
      usd_value: number;
    }[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const select = useCallback(() => formChartData(data), [data]);

  const fetch = async (addr: string, _isTestnet: boolean) => {
    const curve = await requestOpenApiWithChainId(
      ({ openapi }) => openapi.getNetCurve(addr),
      {
        isTestnet: _isTestnet,
      }
    );
    setData(curve);
    setIsLoading(false);
  };

  useEffect(() => {
    setIsLoading(true);
    setData([]);
  }, [address]);

  useEffect(() => {
    if (!address) return;
    fetch(address, isTestnet);
  }, [address, nonce, isTestnet]);

  return isLoading ? undefined : select();
};
