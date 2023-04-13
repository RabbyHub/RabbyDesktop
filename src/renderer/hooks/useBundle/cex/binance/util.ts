import { PortfolioItem, TokenItem } from '@debank/rabby-api/dist/types';
import {
  Asset,
  AssetWithRewards,
  FundingAsset,
  MarginAsset,
  SpotAsset,
} from './type';
import { tokenPrice } from './price';

// TODO 类型需要修复
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

export const toSpotPortfolioList = (spotAsset: SpotAsset) => {
  return spotAsset.map((item) => ({
    ...basePortfolio,
    name: 'Spot' as any,
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

export const toFinancePortfolioList = (
  assets: AssetWithRewards[],
  name: string
) => {
  return assets.map((asset) => {
    return {
      ...basePortfolio,
      name: 'Earn' as any,
      detail: {
        description: name,
        supply_token_list: [toTokenItem(asset)],
        reward_token_list: asset.rewards.map(toTokenItem),
      } as any,
      stats: {
        asset_usd_value: Number(asset.usdtValue),
        debt_usd_value: 0,
        net_usd_value: Number(asset.usdtValue),
      },
    };
  });
};

export const toMarginPortfolio = (
  margin: MarginAsset,
  name = 'Cross Margin'
) => {
  const asset_usd_value = margin.supplies.reduce(
    (acc, cur) => acc + Number(cur.usdtValue),
    0
  );
  const debt_usd_value = margin.borrows.reduce(
    (acc, cur) => acc + Number(cur.usdtValue),
    0
  );
  return {
    ...basePortfolio,
    name: name as any,
    detail_types: ['lending'],
    detail: {
      supply_token_list: margin.supplies.map(toTokenItem),
      borrow_token_list: margin.borrows.map(toTokenItem),
      health_rate: margin.healthRate,
    } as any,
    stats: {
      asset_usd_value,
      debt_usd_value,
      // TODO 是不是要加上收益啊
      net_usd_value: asset_usd_value,
    },
  };
};

export const toIsolatedMarginPortfolioList = (
  isolatedMargin: MarginAsset[]
) => {
  return isolatedMargin.map((item) =>
    toMarginPortfolio(item, 'Isolated Margin')
  );
};
