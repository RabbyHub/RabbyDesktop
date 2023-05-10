export const numFormat = (
  num?: string | number,
  precision?: number,
  prefix = '',
  postiveSymbol = false,
  abbreviate = true
) => {
  if (!num) {
    return num === 0 ? `${postiveSymbol ? '+' : ''}${prefix}0` : '-';
  }

  const _num = Number(num);

  if (abbreviate) {
    if (Math.abs(_num) >= 1e9) {
      return `${prefix}${Number((_num / 1e9).toFixed(1))}B`;
    }
  }

  const symbol = _num < 0 ? '-' : postiveSymbol ? '+' : '';
  const _precision = precision ?? (_num < 1 ? 4 : 2);
  const parts = Math.abs(_num).toFixed(_precision).split('.');

  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  const formatted = parts.join('.');

  return `${symbol}${prefix}${formatted}`;
};

export const numSeparate = (
  x?: number,
  precision?: number,
  removeSubfixZero = false,
  keepPositive = false,
  thousandsSeparator = true
) => {
  if (x === undefined || x === null) {
    return '-';
  }
  if (x === 0) return '0';

  if (Math.abs(x) > 0 && Math.abs(x) < 0.00005) {
    return `< ${x > 0 ? '' : '-'}0.0001`;
  }
  const _precision = precision ?? 2;
  const num = removeSubfixZero
    ? Number(x.toFixed(_precision)).toString()
    : x.toFixed(_precision);

  const parts: string[] = num.split('.');
  if (thousandsSeparator) {
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }
  return `${keepPositive && x > 0 ? '+' : ''}${parts.join('.')}`;
};
/**
 * 格式化数字
 *
 * 不能保证超出 js 运算范围的数可以正常格式化
 * @param num 数字，可以为字符串，如 '1232.123'
 * @param digit 保留小数，可以定义是否要 trim 小数中的 0
 * @param param2
 * @returns string
 */
export const formatNum = (
  num?: string | number,
  digit = 2,
  {
    floor = 0.0001,
    placeholder = '-',
    prefix = '',
    keepPostiveSign = false,
    // 从哪位符号开始缩写，对应 abbrs，0-'', 1-'k', 2-'m', 3-'b'...
    abbrStart = 3,
    trimFractionZero = true,
    abbrs = ['', 'K', 'M', 'B', 'T'],
  }: {
    floor?: number | false;
    // 只有值是 undefined / NaN / '' 才会使用 placeholder
    placeholder?: string;
    prefix?: string;
    keepPostiveSign?: boolean;
    // 从哪开始缩写
    abbrStart?: number;
    trimFractionZero?: boolean;
    abbrs?: string[];
  } = {}
) => {
  if (!num) {
    return num === 0
      ? `${keepPostiveSign ? '+' : ''}${prefix}${
          trimFractionZero ? '0' : (0).toFixed(digit)
        }`
      : placeholder;
  }

  const _num = Number(num);

  if (Number.isNaN(_num)) {
    return placeholder;
  }

  const sign = _num < 0 ? '-' : keepPostiveSign ? '+' : '';
  const absNum = Math.abs(_num);

  if (absNum < (floor || 0)) {
    return `<${sign}${prefix}${floor}`;
  }

  // eslint-disable-next-line no-bitwise
  const pow = (Math.log10(absNum) / 3) | 0;
  const _pow = abbrStart <= pow ? pow : 0;
  const realPow = _pow < abbrs.length ? _pow : abbrs.length - 1;
  const suffix = abbrs[realPow];

  // eslint-disable-next-line no-restricted-properties
  const roundedNum = (absNum / Math.pow(10, 3 * realPow)).toFixed(digit);

  const parts = roundedNum.split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  parts[1] =
    parts[1] && trimFractionZero ? parts[1].replace(/0+$/, '') : parts[1];
  const formatted = parts[1] ? parts.join('.') : parts[0];

  return `${sign}${prefix}${formatted}${suffix}`;
};

export const formatNetworth = (num?: number) => {
  if (!num && num !== 0) {
    return '';
  }

  // >1b || <1m
  if (num > 1000000000 || num < 1000000) {
    return formatNum(num, 2, {
      prefix: '$',
      floor: 0.01,
      trimFractionZero: false,
    });
  }

  // 1m
  return formatNum(num, 0, { prefix: '$', trimFractionZero: false });
};

export const formatPrice = (num?: number) => {
  if (!num && num !== 0) {
    return '';
  }

  // >1
  if (num >= 1) {
    return formatNum(num, 2, { prefix: '$', trimFractionZero: false });
  }

  const preNum = num.toPrecision(4);

  if (preNum.toString().length > 10) {
    const exNum = num.toExponential(4);

    return `$${exNum}`;
  }

  return `$${preNum}`;
};
