export type GasAccountRecord = {
  chain_id: string;
  token_id: string;
  amount: number;
};

export type GasAccount = {
  address: string;
  type: string;
  brandName: string;
};

export type GasAccountServiceStore = {
  accountId?: string;
  sig?: string;
  account?: GasAccount;
};

export type GasAccountInfo = {
  value:
    | {
        account: {
          id: string;
          balance: number;
          create_at: number;
          nonce: number;
        };
      }
    | undefined;
  loading: boolean;
  account?: {
    address: string;
    type: string;
    brandName: string;
  };
};
