type RabbyAccount = {
  address: string;
  type: string;
  brandName: string;
};

type RabbyEvent = {
  event: string;
  data?: any;
  origin?: string;
};

type IConnectedSiteInfo = {
  chain: import('@debank/common').CHAINS_ENUM;
  icon: string;
  isConnected: boolean;
  isSigned: boolean;
  isTop: boolean;
  name: string;
  origin: string;
};
