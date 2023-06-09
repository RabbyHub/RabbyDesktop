import { PortfolioItem, TokenItem } from '@debank/rabby-api/dist/types';
import { Asset, FundingAsset } from './type';
import { tokenPrice } from './okx';

// TODO rabby-api 里提供的类型和实际返回不符
const basePortfolio = {
  detail_types: ['common'],
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
