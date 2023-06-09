import BigNumber from 'bignumber.js';

const USDT = 'USDT';
const USDT_RE = new RegExp(`${USDT}$`);
/**
 * 缓存符号对应价格，多个 bn 账户共用价格数据
 */
export class TokenPrice {
  private symbols: Set<string> = new Set();

  prices: Record<
    string,
    {
      value: string;
      lastUpdate: number;
    }
  > = {};

  // 1 min 过期，重新获取价格
  expire: number = 1000 * 60;

  update(
    data: {
      symbol: string;
      price: string;
    }[]
  ) {
    data.forEach(({ symbol, price }) => {
      this.prices[symbol.replace(USDT_RE, '')] = {
        value: price,
        lastUpdate: Date.now(),
      };
    });
  }

  addSymbol(symbol: string) {
    if (!symbol) {
      return;
    }
    this.symbols.add(symbol);
  }

  getSymbols() {
    const symbols = [...this.symbols].filter((s) => {
      return (
        !this.prices[s] || Date.now() - this.prices[s].lastUpdate > this.expire
      );
    });

    return symbols.filter((s) => s !== USDT);
  }

  getUSDTSymbols(symbols: string[]) {
    return symbols.filter((s) => s !== USDT).map((s) => `${s}${USDT}`);
  }

  // 计算 symbol 对应的 USDT 价格
  getUSDTValue(symbol: string, value: string) {
    const price = this.prices[symbol];

    if (symbol === USDT) {
      return value;
    }

    if (!price) {
      return '0';
    }

    return new BigNumber(value).times(price.value).toString();
  }

  getPrice(symbol: string) {
    if (symbol === USDT) {
      return 1;
    }
    return this.prices[symbol]?.value;
  }
}
