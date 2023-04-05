import BigNumber from 'bignumber.js';

export const plusBigNumber = (...values: string[]) => {
  const result = values.reduce((prev, curr) => {
    return new BigNumber(prev).plus(curr).toString();
  }, '0');

  return result;
};
