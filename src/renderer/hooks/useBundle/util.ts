import { BigNumber } from 'bignumber.js';

/**
 * 大数累加
 */
export const bigNumberSum = (...values: (string | number | undefined)[]) => {
  const result = values.reduce((prev = 0, curr = 0) => {
    return new BigNumber(prev).plus(curr).toString();
  }, '0');

  return result;
};

/**
 * 小于 10u 的返回 false
 */
export const valueGreaterThan10 = (value: string, target = '10') => {
  return new BigNumber(value).isGreaterThanOrEqualTo(target);
};

/**
 * 合并列表，根据指定的字段累加对应的值
 */
export const mergeList = <T>(
  array: T[],
  key: keyof T,
  mergeKeys: (keyof T)[]
) => {
  const result: T[] = [];

  array.forEach((item) => {
    const index = result.findIndex((r) => r[key] === item[key]);

    if (index >= 0) {
      mergeKeys.forEach((k) => {
        // TODO 需要测试下协议
        if (Array.isArray(item[k])) {
          result[index][k] = [
            ...(result[index][k] as any[]),
            ...(item[k] as any[]),
          ] as any;
          return;
        }

        result[index][k] = bigNumberSum(
          result[index][k] as string,
          item[k] as string
        ) as any;

        if (typeof item[k] === 'number') {
          result[index][k] = new BigNumber(
            result[index][k] as string
          ).toNumber() as any;
        }
      });
    } else {
      result.push(item);
    }
  });

  return result;
};
