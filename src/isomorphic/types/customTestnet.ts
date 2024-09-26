export interface TestnetChainBase {
  id: number;
  name: string;
  nativeTokenSymbol: string;
  rpcUrl: string;
  scanLink?: string;
}

export interface TestnetChain extends TestnetChainBase {
  nativeTokenAddress: string;
  hex: string;
  network: string;
  enum: CHAINS_ENUM;
  serverId: string;
  nativeTokenLogo: string;
  eip: Record<string, any>;
  nativeTokenDecimals: number;
  scanLink: string;
  isTestnet?: boolean;
  logo: string;
  whiteLogo?: string;
  needEstimateGas?: boolean;
}
