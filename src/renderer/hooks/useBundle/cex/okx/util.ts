import { PortfolioItem, TokenItem } from '@rabby-wallet/rabby-api/dist/types';
import { Asset, FundingAsset, MarginAsset } from './type';
import { tokenPrice } from './okx';
import { bigNumberSum } from '../../util';

// TODO rabby-api 里提供的类型和实际返回不符
const basePortfolio = {
  detail_types: ['cex'],
  asset_token_list: [],
  asset_dict: {},
  update_at: new Date().getTime(),
  proxy_detail: undefined as any,
  pool: undefined as any,
  position_index: undefined as any,
};

const toTokenItem = (item: Asset) => {
  return {
    name: item.asset,
    symbol: item.asset,
    usd_value: Number(item.usdtValue),
    chain: '0',
    id: item.asset,
    amount: Number(item.value),
    price: Number(tokenPrice.getPrice(item.asset)),
  } as TokenItem;
};

export const toFundingPortfolioList = (fundingAsset: FundingAsset) => {
  return fundingAsset.map((item) => ({
    ...basePortfolio,
    name: 'Funding' as any,
    detail: {
      supply_token_list: [toTokenItem(item)],
    } as any,
    stats: {
      asset_usd_value: Number(item.usdtValue),
      debt_usd_value: 0,
      net_usd_value: Number(item.usdtValue),
    },
  })) as PortfolioItem[];
};

export const toFinancePortfolio = (assets: Asset[]) => {
  const usdtValue = Number(
    bigNumberSum(...assets.map((item) => item.usdtValue))
  );
  return {
    ...basePortfolio,
    name: 'Grow' as any,
    detail: {
      description: '',
      supply_token_list: assets.map(toTokenItem),
      reward_token_list: [],
    } as any,
    stats: {
      asset_usd_value: usdtValue,
      debt_usd_value: 0,
      net_usd_value: usdtValue,
    },
  };
};

export const toMarginPortfolio = (margin: MarginAsset) => {
  const asset_usd_value = margin.supplies.reduce(
    (acc, cur) => acc + Number(cur.usdtValue),
    0
  );
  const debt_usd_value = margin.borrows.reduce(
    (acc, cur) => acc + Number(cur.usdtValue),
    0
  );
  if (margin.supplies.length <= 0) return null;
  return {
    ...basePortfolio,
    name: 'Trading',
    detail: {
      supply_token_list: margin.supplies.map(toTokenItem),
      borrow_token_list: margin.borrows.map(toTokenItem),
      health_rate: Number(margin.healthRate),
    } as any,
    stats: {
      asset_usd_value,
      debt_usd_value,
      net_usd_value: asset_usd_value - debt_usd_value,
    },
  };
};
