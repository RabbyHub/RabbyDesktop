import { PortfolioItem, TokenItem } from '@debank/rabby-api/dist/types';
import {
  Asset,
  AssetWithRewards,
  FundingAsset,
  MarginAsset,
  SpotAsset,
} from './type';
import { tokenPrice } from './binance';
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
  const portfolio = {
    ...basePortfolio,
    name: 'Funding' as any,
    detail: {
      supply_token_list: fundingAsset.map(toTokenItem),
      reward_token_list: [],
      borrow_token_list: [],
    },
    stats: {
      asset_usd_value: Number(
        bigNumberSum(...fundingAsset.map((item) => item.usdtValue))
      ),
      debt_usd_value: 0,
      net_usd_value: Number(
        bigNumberSum(...fundingAsset.map((item) => item.usdtValue))
      ),
    },
  } as PortfolioItem;
  return fundingAsset.length > 0 ? portfolio : null;
};

export const toSpotPortfolioList = (spotAsset: SpotAsset) => {
  const portfolio = {
    ...basePortfolio,
    name: 'Spot' as any,
    detail: {
      supply_token_list: spotAsset.map(toTokenItem),
      reward_token_list: [],
      borrow_token_list: [],
    },
    stats: {
      asset_usd_value: Number(
        bigNumberSum(...spotAsset.map((item) => item.usdtValue))
      ),
      debt_usd_value: 0,
      net_usd_value: Number(
        bigNumberSum(...spotAsset.map((item) => item.usdtValue))
      ),
    },
  } as PortfolioItem;
  return spotAsset.length > 0 ? portfolio : null;
};

export const toFinancePortfolioList = (assets: AssetWithRewards[]) => {
  const tokenMap: Record<
    string,
    {
      asset: string;
      value: string;
      usdtValue: string;
    }
  > = {};
  assets.forEach((a) => {
    a.assets.forEach((item) => {
      const asset = tokenMap[item.asset];
      if (asset) {
        asset.usdtValue = bigNumberSum(item.usdtValue, asset.usdtValue);
      } else {
        tokenMap[item.asset] = item;
      }
    });
  });
  const list = Object.values(tokenMap);
  return list.length > 0
    ? {
        ...basePortfolio,
        name: 'Earn' as any,
        detail: {
          description: '',
          supply_token_list: list.map(toTokenItem),
        } as any,
        stats: {
          asset_usd_value: Number(
            bigNumberSum(...list.map((item) => item.usdtValue))
          ),
          debt_usd_value: 0,
          net_usd_value: Number(
            bigNumberSum(...list.map((item) => item.usdtValue))
          ),
        },
      }
    : null;
};

export const toFuturePortfolio = (assets: Asset[], name: string) => {
  return {
    ...basePortfolio,
    name,
    detail: {
      supply_token_list: assets.map(toTokenItem),
    },
    stats: {
      asset_usd_value: Number(...assets.map((item) => item.usdtValue)),
      debt_usd_value: 0,
      net_usd_value: Number(...assets.map((item) => item.usdtValue)),
    },
  };
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
    detail: {
      supply_token_list: margin.supplies.map(toTokenItem),
      borrow_token_list: margin.borrows.map(toTokenItem),
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
  const borrowTokenMap: Record<string, Asset> = {};
  const supplyTokenMap: Record<string, Asset> = {};
  isolatedMargin.forEach((item) => {
    item.supplies.forEach((token) => {
      const exist = supplyTokenMap[token.asset];
      if (exist) {
        exist.value = bigNumberSum(exist.value, token.value);
        exist.usdtValue = bigNumberSum(exist.usdtValue, token.usdtValue);
      } else {
        supplyTokenMap[token.asset] = token;
      }
    });
    item.borrows.forEach((token) => {
      const exist = borrowTokenMap[token.asset];
      if (exist) {
        exist.value = bigNumberSum(exist.value, token.value);
        exist.usdtValue = bigNumberSum(exist.usdtValue, token.usdtValue);
      } else {
        borrowTokenMap[token.asset] = token;
      }
    });
  });
  return Object.values(supplyTokenMap).length > 0
    ? toMarginPortfolio(
        {
          supplies: Object.values(supplyTokenMap),
          borrows: Object.values(borrowTokenMap),
          healthRate: '1',
        },
        'Isolated Margin'
      )
    : null;
};
