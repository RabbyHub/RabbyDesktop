import { TokenItem } from '@debank/rabby-api/dist/types';
import groupBy from 'lodash/groupBy';

export type NftCollection = {
  chain_id: string;
  id: string;
  name: string;
  symbol?: string;
  logo_url: string;
  is_core: boolean;
  amount?: number;
  floor_price_token?: TokenItem;
};

export type PortfolioItemNft = {
  id: string;
  contract_id: string;
  inner_id: string;
  name: string;
  content_url: string;
  thumbnail_url: string;
  collection: NftCollection;
  amount: number;
};

export const polyNfts = (nfts: PortfolioItemNft[]) => {
  const poly = groupBy(nfts, (n) => n.collection.id);
  return Object.values(poly).map((arr) => {
    const amount = arr.reduce((sum, n) => {
      sum += n.amount;
      return sum;
    }, 0);
    return { ...arr[0], amount };
  });
};

export const getCollectionDisplayName = (c?: NftCollection) =>
  c ? c.symbol || c.name : '';
