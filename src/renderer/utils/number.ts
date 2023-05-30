import BigNumber from 'bignumber.js';

BigNumber.config({
  ROUNDING_MODE: BigNumber.ROUND_DOWN,
});

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

export const numberWithCommasIsLtOne = (
  x?: number | string | BigNumber,
  precision?: number
) => {
  if (x === undefined || x === null) {
    return '-';
  }
  if (x.toString() === '0') return '0';

  if (x < 0.00005) {
    return '< 0.0001';
  }
  precision = x < 1 ? 4 : precision ?? 2;
  const parts: string[] = Number(x).toFixed(precision).split('.');

  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return parts.join('.');
};

export const formatNumber = (
  num: string | number,
  decimal = 2,
  opt = {} as BigNumber.Format
) => {
  const n = new BigNumber(num);
  const format = {
    prefix: '',
    decimalSeparator: '.',
    groupSeparator: ',',
    groupSize: 3,
    secondaryGroupSize: 0,
    fractionGroupSeparator: ' ',
    fractionGroupSize: 0,
    suffix: '',
    ...opt,
  };
  // hide the after-point part if number is more than 1000000
  if (n.isGreaterThan(1000000)) {
    if (n.gte(1e9)) {
      return `${n.div(1e9).toFormat(decimal, format)}B`;
    }
    return n.decimalPlaces(0).toFormat(format);
  }
  return n.toFormat(decimal, format);
};

export const formatPrice = (price: string | number) => {
  if (price >= 1) {
    return formatNumber(price);
  }
  if (price < 0.00001) {
    if (price.toString().length > 10) {
      return Number(price).toExponential(4);
    }
    return price.toString();
  }
  return formatNumber(price, 4);
};

export const formatUsdValue = (value: string | number) => {
  const bnValue = new BigNumber(value);
  if (bnValue.lt(0)) {
    return `-$${formatNumber(Math.abs(Number(value)))}`;
  }
  if (bnValue.gte(0.01) || bnValue.eq(0)) {
    return `$${formatNumber(value)}`;
  }
  return '<$0.01';
};

export const formatAmount = (amount: string | number) => {
  const num = Number(amount);
  if (!num && num !== 0) {
    return '';
  }

  const sign = `${num < 0 ? '-' : ''}`;
  BigNumber.config({
    EXPONENTIAL_AT: [-10, 20],
  });
  const absNum = new BigNumber(amount).abs();

  if (absNum.lt(1)) {
    if (num === 0) {
      return `0.0000`;
    }
    const preNum = absNum.toPrecision(4);

    if (preNum.length > 10) {
      return sign + absNum.toExponential(4);
    }

    return sign + preNum;
  }

  const format = {
    prefix: '',
    decimalSeparator: '.',
    groupSeparator: ',',
    groupSize: 3,
    secondaryGroupSize: 0,
    fractionGroupSeparator: ' ',
    fractionGroupSize: 0,
    suffix: '',
  };

  if (absNum.lt(10_000)) {
    return sign + absNum.toFormat(4, format);
  }

  if (absNum.lt(1000_000)) {
    return sign + absNum.toFormat(2, format);
  }

  if (absNum.gte(1e12)) {
    return `${sign}${absNum.div(1e9).toFormat(4, format)}T`;
  }

  if (absNum.gte(1e9)) {
    return `${sign}${absNum.div(1e9).toFormat(4, format)}B`;
  }

  if (absNum.lt(1000_000)) {
    return sign + absNum.toFormat(2, format);
  }

  return sign + absNum.toFormat(0, format);
};

export const intToHex = (n: number) => {
  if (n % 1 !== 0) throw new Error(`${n} is not int`);
  return `0x${n.toString(16)}`;
};
