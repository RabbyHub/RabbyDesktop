import { BigNumber } from 'bignumber.js';
/**
 *
 * 合并数组列表，例如
 * [ [ assets: 'BTC', value: '10' ], [ assets: 'BTC', value: '20' ] ]
 */
export const bundleArrayList = <T>(
  list: T[][],
  // string in T
  key: keyof T,
  mergeKeys: (keyof T)[]
) => {
  const result: T[] = [];
  list.forEach((account) => {
    account.forEach((asset) => {
      const index = result.findIndex((i) => i[key] === asset[key]);
      if (index === -1) {
        result.push({ ...asset });
      } else {
        mergeKeys.forEach((mergeKey) => {
          const value = result[index][mergeKey] as string;
          const plus = asset[mergeKey] as string;

          result[index][mergeKey] = new BigNumber(value)
            .plus(plus)
            .toString() as any;
        });
      }
    });
  });

  return result;
};
