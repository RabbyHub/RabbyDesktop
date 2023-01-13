import BigNumber from 'bignumber.js';

export const splitNumberByStep = (
  num: number | string,
  step = 3,
  symbol = ',',
  forceInt = false
) => {
  const fmt: BigNumber.Format = {
    decimalSeparator: '.',
    groupSeparator: symbol,
    groupSize: step,
  };
  const n = new BigNumber(num);
  // hide the after-point part if number is more than 1000000
  if (n.isGreaterThan(1000000) || forceInt) {
    return n.decimalPlaces(0).toFormat(fmt);
  }
  return n.toFormat(fmt);
};
