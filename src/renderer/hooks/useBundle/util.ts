import { BigNumber } from 'bignumber.js';

export const plusBigNumber = (...values: string[]) => {
  const result = values.reduce((prev, curr) => {
    return new BigNumber(prev).plus(curr).toString();
  }, '0');

  return result;
};

// 小于 10u 的返回 false
export const valueGreaterThan10 = (value: string, target = '10') => {
  return new BigNumber(value).isGreaterThanOrEqualTo(target);
};

// 指定字段相同的合并值
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
        result[index][k] = plusBigNumber(
          result[index][k] as string,
          item[k] as string
        ) as any;
      });
    } else {
      result.push(item);
    }
  });

  return result;
};
