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
