export type Token = {
  id: string;
  chain: string;
  name: string;
  symbol: string;
  display_symbol?: string;
  optimized_symbol?: string;
  price: number;
  decimals: number;
  logo_url: string;
  is_core: boolean;
  is_verified: boolean;
  is_custom: boolean;
};

export interface Tokens {
  id: string;
  amount: number;
  decimals: number;
  name: string;
  symbol: string;
  price?: number;
  chain: string;
  balance?: string;
  logo_url?: string;
  is_verified: boolean;
  is_core?: boolean;
  is_swap_hot?: boolean;
  display_symbol?: string;
  optimized_symbol?: string;
  is_custom?: boolean;

  // nft
  contract_id?: string;
  inner_id?: string;
  content?: string;
  content_type?: 'image_url';
}

export interface Coin {
  id: string;
  amount: number;
  price: number;
  symbol: string;
  logo: string;
  logo_url?: string;
  token_uuids: string[];
}
