export var CHAINS_ENUM;
(function (CHAINS_ENUM) {
  CHAINS_ENUM['ETH'] = 'ETH';
  CHAINS_ENUM['BSC'] = 'BSC';
  CHAINS_ENUM['GNOSIS'] = 'GNOSIS';
  CHAINS_ENUM['HECO'] = 'HECO';
  CHAINS_ENUM['POLYGON'] = 'POLYGON';
  CHAINS_ENUM['FTM'] = 'FTM';
  CHAINS_ENUM['OKT'] = 'OKT';
  CHAINS_ENUM['ARBITRUM'] = 'ARBITRUM';
  CHAINS_ENUM['AVAX'] = 'AVAX';
  CHAINS_ENUM['OP'] = 'OP';
  CHAINS_ENUM['CELO'] = 'CELO';
  CHAINS_ENUM['MOVR'] = 'MOVR';
  CHAINS_ENUM['CRO'] = 'CRO';
  CHAINS_ENUM['BOBA'] = 'BOBA';
  CHAINS_ENUM['METIS'] = 'METIS';
  CHAINS_ENUM['BTT'] = 'BTT';
  CHAINS_ENUM['AURORA'] = 'AURORA';
  CHAINS_ENUM['MOBM'] = 'MOBM';
  CHAINS_ENUM['SBCH'] = 'SBCH';
  CHAINS_ENUM['FUSE'] = 'FUSE';
  CHAINS_ENUM['HMY'] = 'HMY';
  CHAINS_ENUM['PALM'] = 'PALM';
  CHAINS_ENUM['ASTAR'] = 'ASTAR';
  CHAINS_ENUM['SDN'] = 'SDN';
  CHAINS_ENUM['KLAY'] = 'KLAY';
  CHAINS_ENUM['IOTX'] = 'IOTX';
  CHAINS_ENUM['RSK'] = 'RSK';
  CHAINS_ENUM['WAN'] = 'WAN';
  CHAINS_ENUM['KCC'] = 'KCC';
  CHAINS_ENUM['SGB'] = 'SGB';
  CHAINS_ENUM['EVMOS'] = 'EVMOS';
  CHAINS_ENUM['DFK'] = 'DFK';
  CHAINS_ENUM['TLOS'] = 'TLOS';
  CHAINS_ENUM['NOVA'] = 'NOVA';
  CHAINS_ENUM['CANTO'] = 'CANTO';
  CHAINS_ENUM['DOGE'] = 'DOGE';
  CHAINS_ENUM['STEP'] = 'STEP';
  CHAINS_ENUM['KAVA'] = 'KAVA';
  CHAINS_ENUM['MADA'] = 'MADA';
  CHAINS_ENUM['CFX'] = 'CFX';
  CHAINS_ENUM['BRISE'] = 'BRISE';
  CHAINS_ENUM['CKB'] = 'CKB';
  CHAINS_ENUM['TOMB'] = 'TOMB';
  CHAINS_ENUM['PZE'] = 'PZE';
  CHAINS_ENUM['ERA'] = 'ERA';
  CHAINS_ENUM['EOS'] = 'EOS';
  CHAINS_ENUM['CORE'] = 'CORE';
  CHAINS_ENUM['FLR'] = 'FLR';
  CHAINS_ENUM['WEMIX'] = 'WEMIX';
  CHAINS_ENUM['METER'] = 'METER';
  CHAINS_ENUM['ETC'] = 'ETC';
  CHAINS_ENUM['FSN'] = 'FSN';
  CHAINS_ENUM['PULSE'] = 'PULSE';
  CHAINS_ENUM['ROSE'] = 'ROSE';
  // CHAINS_ENUM["RONIN"] = "RONIN";
  CHAINS_ENUM['OAS'] = 'OAS';
  CHAINS_ENUM['ZORA'] = 'ZORA';
  CHAINS_ENUM['LINEA'] = 'LINEA';
  CHAINS_ENUM['BASE'] = 'BASE';
  CHAINS_ENUM['GETH'] = 'GETH';
  CHAINS_ENUM['GARBITRUM'] = 'GARBITRUM';
  CHAINS_ENUM['CGNOSIS'] = 'CGNOSIS';
  CHAINS_ENUM['MANTLE'] = 'MANTLE';
  CHAINS_ENUM['TENET'] = 'TENET';
  CHAINS_ENUM['TBSC'] = 'TBSC';
  CHAINS_ENUM['MPOLYGON'] = 'MPOLYGON';
  CHAINS_ENUM['GOP'] = 'GOP';
  CHAINS_ENUM['GBOBA'] = 'GBOBA';
  CHAINS_ENUM['GBASE'] = 'GBASE';
  CHAINS_ENUM['GLINEA'] = 'GLINEA';
  CHAINS_ENUM['TFTM'] = 'TFTM';
  CHAINS_ENUM['LYX'] = 'LYX';
  CHAINS_ENUM['TLYX'] = 'TLYX';
  CHAINS_ENUM['TDEBANK'] = 'TDEBANK';
  CHAINS_ENUM['TMNT'] = 'TMNT';
  CHAINS_ENUM['OPBNB'] = 'OPBNB';
  CHAINS_ENUM['GERA'] = 'GERA';
  CHAINS_ENUM['PMANTA'] = 'PMANTA';
  CHAINS_ENUM['TOPBNB'] = 'TOPBNB';
  CHAINS_ENUM['TTENET'] = 'TTENET';
  CHAINS_ENUM['LOOT'] = 'LOOT';
  CHAINS_ENUM['TLOOT'] = 'TLOOT';
  CHAINS_ENUM['SETH'] = 'SETH';
  CHAINS_ENUM['SSCROLL'] = 'SSCROLL';
  CHAINS_ENUM['AZETA'] = 'AZETA';
})(CHAINS_ENUM || (CHAINS_ENUM = {}));
export const CHAINS_RAW = {
  [CHAINS_ENUM.ETH]: {
    id: 1,
    serverId: 'eth',
    name: 'Ethereum',
    hex: '0x1',
    enum: CHAINS_ENUM.ETH,
    network: '1',
    nativeTokenSymbol: 'ETH',
    nativeTokenLogo:
      'https://static.debank.com/image/token/logo_url/eth/935ae4e4d1d12d59a99717a24f2540b5.png',
    nativeTokenDecimals: 18,
    nativeTokenAddress: 'eth',
    scanLink: 'https://etherscan.io/tx/_s_',
    eip: {
      1559: true,
    },
  },
  [CHAINS_ENUM.BSC]: {
    id: 56,
    name: 'BNB Chain',
    serverId: 'bsc',
    hex: '0x38',
    enum: CHAINS_ENUM.BSC,
    network: '56',
    nativeTokenSymbol: 'BNB',
    nativeTokenAddress: 'bsc',
    scanLink: 'https://bscscan.com/tx/_s_',
    nativeTokenLogo:
      'https://static.debank.com/image/bsc_token/logo_url/bsc/8bfdeaa46fe9be8f5cd43a53b8d1eea1.png',
    nativeTokenDecimals: 18,
    eip: {
      1559: false,
    },
  },
  [CHAINS_ENUM.GNOSIS]: {
    id: 100,
    name: 'Gnosis Chain',
    serverId: 'xdai',
    hex: '0x64',
    enum: CHAINS_ENUM.GNOSIS,
    network: '100',
    nativeTokenSymbol: 'xDai',
    nativeTokenAddress: 'xdai',
    scanLink: 'https://gnosisscan.io/tx/_s_',
    nativeTokenLogo:
      'https://static.debank.com/image/xdai_token/logo_url/xdai/1207e67652b691ef3bfe04f89f4b5362.png',
    nativeTokenDecimals: 18,
    eip: {
      1559: true,
    },
  },
  [CHAINS_ENUM.POLYGON]: {
    id: 137,
    serverId: 'matic',
    name: 'Polygon',
    hex: '0x89',
    enum: CHAINS_ENUM.POLYGON,
    network: '137',
    nativeTokenSymbol: 'MATIC',
    nativeTokenAddress: 'matic',
    nativeTokenDecimals: 18,
    scanLink: 'https://polygonscan.com/tx/_s_',
    nativeTokenLogo:
      'https://static.debank.com/image/matic_token/logo_url/matic/e5a8a2860ba5cf740a474dcab796dc63.png',
    eip: {
      1559: true,
    },
  },
  [CHAINS_ENUM.FTM]: {
    id: 250,
    serverId: 'ftm',
    name: 'Fantom',
    hex: '0xfa',
    enum: CHAINS_ENUM.FTM,
    network: '250',
    nativeTokenSymbol: 'FTM',
    nativeTokenAddress: 'ftm',
    scanLink: 'https://ftmscan.com/tx/_s_',
    nativeTokenLogo:
      'https://static.debank.com/image/token/logo_url/eth/935ae4e4d1d12d59a99717a24f2540b5.png',
    nativeTokenDecimals: 18,
    eip: {
      1559: false,
    },
  },
  [CHAINS_ENUM.OKT]: {
    id: 66,
    serverId: 'okt',
    name: 'OKC',
    enum: CHAINS_ENUM.OKT,
    hex: '0x42',
    network: '66',
    nativeTokenSymbol: 'OKT',
    nativeTokenAddress: 'okt',
    scanLink: 'https://www.oklink.com/okexchain/tx/_s_',
    nativeTokenLogo:
      'https://static.debank.com/image/ftm_token/logo_url/ftm/33fdb9c5067e94f3a1b9e78f6fa86984.png',
    nativeTokenDecimals: 18,
    eip: {
      1559: false,
    },
  },
  [CHAINS_ENUM.HECO]: {
    id: 128,
    serverId: 'heco',
    name: 'HECO',
    enum: CHAINS_ENUM.HECO,
    hex: '0x80',
    network: '128',
    nativeTokenSymbol: 'HT',
    nativeTokenAddress: 'heco',
    scanLink: 'https://hecoinfo.com/tx/_s_',
    nativeTokenLogo:
      'https://static.debank.com/image/heco_token/logo_url/heco/c399dcddde07e1944c4dd8f922832b53.png',
    nativeTokenDecimals: 18,
    eip: {
      1559: true,
    },
  },
  [CHAINS_ENUM.AVAX]: {
    id: 43114,
    serverId: 'avax',
    network: '43114',
    name: 'Avalanche',
    nativeTokenSymbol: 'AVAX',
    nativeTokenAddress: 'avax',
    enum: CHAINS_ENUM.AVAX,
    hex: '0xa86a',
    scanLink: 'https://snowtrace.io/tx/_s_',
    nativeTokenLogo:
      'https://static.debank.com/image/avax_token/logo_url/avax/0b9c84359c84d6bdd5bfda9c2d4c4a82.png',
    nativeTokenDecimals: 18,
    eip: {
      1559: true,
    },
  },
  [CHAINS_ENUM.ARBITRUM]: {
    id: 42161,
    serverId: 'arb',
    name: 'Arbitrum',
    enum: CHAINS_ENUM.ARBITRUM,
    hex: '0xa4b1',
    network: '42161',
    nativeTokenSymbol: 'ETH',
    nativeTokenAddress: 'arb',
    scanLink: 'https://arbiscan.io/tx/_s_',
    nativeTokenLogo:
      'https://static.debank.com/image/arb_token/logo_url/arb/d61441782d4a08a7479d54aea211679e.png',
    nativeTokenDecimals: 18,
    eip: {
      1559: true,
    },
  },
  [CHAINS_ENUM.OP]: {
    id: 10,
    serverId: 'op',
    network: '10',
    name: 'Optimism',
    enum: CHAINS_ENUM.OP,
    hex: '0xa',
    scanLink: 'https://optimistic.etherscan.io/tx/_s_',
    nativeTokenSymbol: 'ETH',
    nativeTokenAddress: 'op',
    nativeTokenLogo:
      'https://static.debank.com/image/op_token/logo_url/op/d61441782d4a08a7479d54aea211679e.png',
    nativeTokenDecimals: 18,
    eip: {
      1559: false,
    },
  },
  [CHAINS_ENUM.CELO]: {
    id: 42220,
    serverId: 'celo',
    network: '42220',
    name: 'Celo',
    nativeTokenSymbol: 'CELO',
    nativeTokenAddress: 'celo',
    enum: CHAINS_ENUM.CELO,
    hex: '0xa4ec',
    scanLink: 'https://celoscan.io/tx/_s_',
    nativeTokenLogo:
      'https://static.debank.com/image/celo_token/logo_url/0x471ece3750da237f93b8e339c536989b8978a438/6f524d91db674876ba0f5767cf0124cc.png',
    nativeTokenDecimals: 18,
    eip: {
      1559: false,
    },
  },
  [CHAINS_ENUM.MOVR]: {
    id: 1285,
    serverId: 'movr',
    network: '1285',
    name: 'Moonriver',
    nativeTokenSymbol: 'MOVR',
    nativeTokenAddress: 'movr',
    enum: CHAINS_ENUM.MOVR,
    hex: '0x505',
    scanLink: 'https://moonriver.moonscan.io/tx/_s_',
    nativeTokenLogo:
      'https://static.debank.com/image/chain/logo_url/movr/c66f89fdceaea8d8fce263a1f816d671.png',
    nativeTokenDecimals: 18,
    eip: {
      1559: true,
    },
  },
  [CHAINS_ENUM.CRO]: {
    id: 25,
    serverId: 'cro',
    network: '25',
    name: 'Cronos',
    nativeTokenSymbol: 'CRO',
    nativeTokenAddress: 'cro',
    enum: CHAINS_ENUM.CRO,
    hex: '0x19',
    scanLink: 'https://cronoscan.com/tx/_s_',
    nativeTokenLogo:
      'https://static.debank.com/image/chain/logo_url/cro/affddd53019ffb9dbad0c724e12500c0.png',
    nativeTokenDecimals: 18,
    eip: {
      1559: true,
    },
  },
  [CHAINS_ENUM.BOBA]: {
    id: 288,
    serverId: 'boba',
    network: '288',
    name: 'Boba',
    nativeTokenSymbol: 'ETH',
    nativeTokenAddress: 'boba',
    enum: CHAINS_ENUM.BOBA,
    hex: '0x120',
    scanLink: 'https://blockexplorer.boba.network/tx/_s_',
    nativeTokenLogo:
      'https://static.debank.com/image/op_token/logo_url/0x4200000000000000000000000000000000000006/d61441782d4a08a7479d54aea211679e.png',
    nativeTokenDecimals: 18,
    eip: {
      1559: false,
    },
  },
  [CHAINS_ENUM.METIS]: {
    id: 1088,
    serverId: 'metis',
    network: '1088',
    name: 'Metis',
    nativeTokenSymbol: 'Metis',
    nativeTokenAddress: 'metis',
    enum: CHAINS_ENUM.METIS,
    hex: '0x440',
    scanLink: 'https://andromeda-explorer.metis.io/tx/_s_',
    nativeTokenLogo:
      'https://static.debank.com/image/chain/logo_url/metis/b289da32db4d860ebf6fb46a6e41dcfc.png',
    nativeTokenDecimals: 18,
    eip: {
      1559: false,
    },
  },
  [CHAINS_ENUM.BTT]: {
    id: 199,
    serverId: 'btt',
    network: '199',
    name: 'BTTC',
    nativeTokenSymbol: 'BTT',
    nativeTokenAddress: 'btt',
    enum: CHAINS_ENUM.BTT,
    hex: '0xc7',
    scanLink: 'https://bttcscan.com/tx/_s_',
    nativeTokenLogo:
      'https://static.debank.com/image/chain/logo_url/btt/2130a8d57ff2a0f3d50a4ec9432897c6.png',
    nativeTokenDecimals: 18,
    eip: {
      1559: false,
    },
  },
  [CHAINS_ENUM.AURORA]: {
    id: 1313161554,
    serverId: 'aurora',
    network: '1313161554',
    name: 'Aurora',
    nativeTokenSymbol: 'AETH',
    nativeTokenAddress: 'aurora',
    enum: CHAINS_ENUM.AURORA,
    hex: '0x4e454152',
    scanLink: 'https://aurorascan.dev/tx/_s_',
    nativeTokenLogo:
      'https://static.debank.com/image/token/logo_url/eth/935ae4e4d1d12d59a99717a24f2540b5.png',
    nativeTokenDecimals: 18,
    eip: {
      1559: false,
    },
  },
  [CHAINS_ENUM.MOBM]: {
    id: 1284,
    serverId: 'mobm',
    network: '1284',
    name: 'Moonbeam',
    nativeTokenSymbol: 'GLMR',
    nativeTokenAddress: 'mobm',
    enum: CHAINS_ENUM.MOBM,
    hex: '0x504',
    scanLink: 'https://moonscan.io/tx/_s_',
    nativeTokenLogo:
      'https://static.debank.com/image/mobm_token/logo_url/mobm/a8442077d76b258297181c3e6eb8c9cc.png',
    nativeTokenDecimals: 18,
    eip: {
      1559: true,
    },
  },
  [CHAINS_ENUM.SBCH]: {
    id: 10000,
    serverId: 'sbch',
    network: '10000',
    name: 'smartBCH',
    nativeTokenSymbol: 'BCH',
    nativeTokenAddress: 'sbch',
    enum: CHAINS_ENUM.SBCH,
    hex: '0x2710',
    scanLink: 'https://www.smartscan.cash/transaction/_s_',
    nativeTokenLogo:
      'https://static.debank.com/image/sbch_token/logo_url/sbch/03007b5353bb9e221efb82a6a70d9ec9.png',
    nativeTokenDecimals: 18,
    eip: {
      1559: false,
    },
  },
  [CHAINS_ENUM.HMY]: {
    id: 1666600000,
    serverId: 'hmy',
    network: '1666600000',
    name: 'Harmony',
    nativeTokenSymbol: 'ONE',
    nativeTokenAddress: 'hmy',
    enum: CHAINS_ENUM.HMY,
    hex: '0x63564c40',
    scanLink: 'https://explorer.harmony.one/tx/_s_',
    nativeTokenLogo:
      'https://static.debank.com/image/chain/logo_url/hmy/734c003023531e31c636ae25d5a73172.png',
    nativeTokenDecimals: 18,
    eip: {
      1559: false,
    },
  },
  [CHAINS_ENUM.FUSE]: {
    id: 122,
    serverId: 'fuse',
    network: '122',
    name: 'Fuse',
    nativeTokenSymbol: 'FUSE',
    nativeTokenAddress: 'fuse',
    enum: CHAINS_ENUM.FUSE,
    hex: '0x7a',
    scanLink: 'https://explorer.fuse.io/tx/_s_',
    nativeTokenLogo:
      'https://static.debank.com/image/chain/logo_url/fuse/ea4c9e12e7f646d42aa8fb07ab8dfec8.png',
    nativeTokenDecimals: 18,
    eip: {
      1559: false,
    },
  },
  [CHAINS_ENUM.ASTAR]: {
    id: 592,
    serverId: 'astar',
    network: '592',
    name: 'Astar',
    nativeTokenSymbol: 'ASTR',
    nativeTokenAddress: 'astar',
    enum: CHAINS_ENUM.ASTAR,
    hex: '0x250',
    scanLink: 'https://blockscout.com/astar/tx/_s_',
    nativeTokenLogo:
      'https://static.debank.com/image/chain/logo_url/astar/a827be92d88617a918ea060a9a6f1572.png',
    nativeTokenDecimals: 18,
    eip: {
      1559: true,
    },
  },
  [CHAINS_ENUM.PALM]: {
    id: 11297108109,
    serverId: 'palm',
    network: '11297108109',
    name: 'Palm',
    nativeTokenSymbol: 'PALM',
    nativeTokenAddress: 'palm',
    enum: CHAINS_ENUM.PALM,
    hex: '0x2a15c308d',
    scanLink: 'https://explorer.palm.io/tx/_s_',
    nativeTokenLogo:
      'https://static.debank.com/image/chain/logo_url/palm/45160297f72604eef509ebb3d0d468e7.png',
    nativeTokenDecimals: 18,
    eip: {
      1559: false,
    },
  },
  [CHAINS_ENUM.SDN]: {
    id: 336,
    serverId: 'sdn',
    network: '336',
    name: 'Shiden',
    nativeTokenSymbol: 'SDN',
    nativeTokenAddress: 'sdn',
    enum: CHAINS_ENUM.SDN,
    hex: '0x150',
    scanLink: 'https://blockscout.com/shiden/tx/_s_',
    nativeTokenLogo:
      'https://static.debank.com/image/chain/logo_url/sdn/9b5bcaa0d5f102548f925e968a5e7a25.png',
    nativeTokenDecimals: 18,
    eip: {
      1559: true,
    },
  },
  [CHAINS_ENUM.KLAY]: {
    id: 8217,
    serverId: 'klay',
    network: '8217',
    name: 'Klaytn',
    nativeTokenSymbol: 'KLAY',
    nativeTokenAddress: 'klay',
    enum: CHAINS_ENUM.KLAY,
    hex: '0x2019',
    scanLink: 'https://scope.klaytn.com/tx/_s_',
    nativeTokenLogo:
      'https://static.debank.com/image/chain/logo_url/klay/1df018b8493cb97c50b7e390ef63cba4.png',
    nativeTokenDecimals: 18,
    eip: {
      1559: false,
    },
  },
  [CHAINS_ENUM.RSK]: {
    id: 30,
    serverId: 'rsk',
    network: '30',
    name: 'RSK',
    nativeTokenSymbol: 'RBTC',
    nativeTokenAddress: 'rsk',
    enum: CHAINS_ENUM.RSK,
    hex: '0x1e',
    scanLink: 'https://explorer.rsk.co/tx/_s_',
    nativeTokenLogo:
      'https://static.debank.com/image/chain/logo_url/rsk/2958b02ef823097b70fac99f39889e2e.png',
    nativeTokenDecimals: 18,
    eip: {
      1559: false,
    },
  },
  [CHAINS_ENUM.IOTX]: {
    id: 4689,
    serverId: 'iotx',
    network: '4689',
    name: 'IoTeX',
    nativeTokenSymbol: 'IOTX',
    nativeTokenAddress: 'iotx',
    enum: CHAINS_ENUM.IOTX,
    hex: '0x1251',
    scanLink: 'https://iotexscan.io/tx/_s_',
    nativeTokenLogo:
      'https://static.debank.com/image/chain/logo_url/iotx/d3be2cd8677f86bd9ab7d5f3701afcc9.png',
    nativeTokenDecimals: 18,
    eip: {
      1559: false,
    },
  },
  [CHAINS_ENUM.KCC]: {
    id: 321,
    serverId: 'kcc',
    network: '321',
    name: 'KCC',
    nativeTokenSymbol: 'KCS',
    nativeTokenAddress: 'kcc',
    enum: CHAINS_ENUM.KCC,
    hex: '0x141',
    scanLink: 'https://explorer.kcc.io/tx/_s_',
    nativeTokenLogo:
      'https://static.debank.com/image/chain/logo_url/kcc/3a5a4ef7d5f1db1e53880d70219d75b6.png',
    nativeTokenDecimals: 18,
    eip: {
      1559: false,
    },
  },
  [CHAINS_ENUM.WAN]: {
    id: 888,
    serverId: 'wan',
    network: '888',
    name: 'Wanchain',
    nativeTokenSymbol: 'WAN',
    nativeTokenAddress: 'wan',
    enum: CHAINS_ENUM.WAN,
    hex: '0x378',
    scanLink: 'https://www.wanscan.org/tx/_s_',
    nativeTokenLogo:
      'https://static.debank.com/image/chain/logo_url/wan/f3aa8b31414732ea5e026e05665146e6.png',
    nativeTokenDecimals: 18,
    eip: {
      1559: false,
    },
  },
  [CHAINS_ENUM.SGB]: {
    id: 19,
    serverId: 'sgb',
    network: '19',
    name: 'Songbird',
    nativeTokenSymbol: 'SGB',
    nativeTokenAddress: 'sgb',
    enum: CHAINS_ENUM.SGB,
    hex: '0x13',
    scanLink: 'https://songbird-explorer.flare.network/tx/_s_',
    nativeTokenLogo:
      'https://static.debank.com/image/chain/logo_url/sgb/619f46d574d62a50bdfd9f0e2f47ddc1.png',
    nativeTokenDecimals: 18,
    eip: {
      1559: true,
    },
  },
  [CHAINS_ENUM.EVMOS]: {
    id: 9001,
    serverId: 'evmos',
    network: '9001',
    name: 'Evmos',
    nativeTokenSymbol: 'EVMOS',
    nativeTokenAddress: 'evmos',
    enum: CHAINS_ENUM.EVMOS,
    hex: '0x2329',
    scanLink: 'https://escan.live/tx/_s_',
    nativeTokenLogo:
      'https://static.debank.com/image/chain/logo_url/evmos/26e038b4d5475d5a4b92f7fc08bdabc9.png',
    nativeTokenDecimals: 18,
    eip: {
      1559: true,
    },
  },
  [CHAINS_ENUM.DFK]: {
    id: 53935,
    serverId: 'dfk',
    network: '53935',
    name: 'DFK',
    nativeTokenSymbol: 'JEWEL',
    nativeTokenAddress: 'dfk',
    enum: CHAINS_ENUM.DFK,
    hex: '0xd2af',
    scanLink:
      'https://subnets.avax.network/defi-kingdoms/dfk-chain/explorer/tx/_s_',
    nativeTokenLogo:
      'https://static.debank.com/image/chain/logo_url/dfk/233867c089c5b71be150aa56003f3f7a.png',
    nativeTokenDecimals: 18,
    eip: {
      1559: true,
    },
  },
  [CHAINS_ENUM.TLOS]: {
    id: 40,
    serverId: 'tlos',
    network: '40',
    name: 'Telos',
    nativeTokenSymbol: 'TLOS',
    nativeTokenAddress: 'tlos',
    enum: CHAINS_ENUM.TLOS,
    hex: '0x28',
    scanLink: 'https://www.teloscan.io/tx/_s_',
    nativeTokenLogo:
      'https://static.debank.com/image/chain/logo_url/telos/f9f7493def4c08ed222540bebd8ce87a.png',
    nativeTokenDecimals: 18,
    eip: {
      1559: false,
    },
  },
  [CHAINS_ENUM.NOVA]: {
    id: 42170,
    serverId: 'nova',
    network: '42170',
    name: 'Arbitrum Nova',
    nativeTokenSymbol: 'ETH',
    nativeTokenAddress: 'nova',
    enum: CHAINS_ENUM.NOVA,
    hex: '0xa4ba',
    scanLink: 'https://nova.arbiscan.io/tx/_s_',
    nativeTokenLogo:
      'https://static.debank.com/image/chain/logo_url/nova/06eb2b7add8ba443d5b219c04089c326.png',
    nativeTokenDecimals: 18,
    eip: {
      1559: true,
    },
  },
  [CHAINS_ENUM.CANTO]: {
    id: 7700,
    serverId: 'canto',
    network: '7700',
    name: 'Canto',
    nativeTokenSymbol: 'Canto',
    nativeTokenAddress: 'canto',
    enum: CHAINS_ENUM.CANTO,
    hex: '0x1e14',
    scanLink: 'https://cantoscan.com/tx/_s_',
    nativeTokenLogo:
      'https://static.debank.com/image/chain/logo_url/canto/47574ef619e057d2c6bbce1caba57fb6.png',
    nativeTokenDecimals: 18,
    eip: {
      1559: true,
    },
  },
  [CHAINS_ENUM.DOGE]: {
    id: 2000,
    serverId: 'doge',
    network: '2000',
    name: 'Dogechain',
    nativeTokenSymbol: 'wDOGE',
    nativeTokenAddress: 'doge',
    enum: CHAINS_ENUM.DOGE,
    hex: '0x7d0',
    scanLink: 'https://explorer.dogechain.dog/tx/_s_',
    nativeTokenLogo:
      'https://static.debank.com/image/chain/logo_url/doge/2538141079688a7a43bc22c7b60fb45f.png',
    nativeTokenDecimals: 18,
    eip: {
      1559: false,
    },
  },
  [CHAINS_ENUM.STEP]: {
    id: 1234,
    serverId: 'step',
    network: '1234',
    name: 'Step',
    nativeTokenSymbol: 'FITFI',
    nativeTokenAddress: 'step',
    enum: CHAINS_ENUM.STEP,
    hex: '0x4d2',
    scanLink: 'https://stepscan.io/tx/_s_',
    nativeTokenLogo:
      'https://static.debank.com/image/chain/logo_url/step/db79600b8feafe17845617ca9c606dbe.png',
    nativeTokenDecimals: 18,
    eip: {
      1559: true,
    },
  },
  [CHAINS_ENUM.KAVA]: {
    id: 2222,
    serverId: 'kava',
    network: '2222',
    name: 'Kava',
    nativeTokenSymbol: 'KAVA',
    nativeTokenAddress: 'kava',
    enum: CHAINS_ENUM.KAVA,
    hex: '0x8ae',
    scanLink: 'https://explorer.kava.io/tx/_s_',
    nativeTokenLogo:
      'https://static.debank.com/image/chain/logo_url/step/a09a84faa6fc54a5c86dd41eccd4f9d1.png',
    nativeTokenDecimals: 18,
    eip: {
      1559: true,
    },
  },
  [CHAINS_ENUM.MADA]: {
    id: 2001,
    serverId: 'mada',
    network: '2001',
    name: 'Milkomeda',
    nativeTokenSymbol: 'milkADA',
    nativeTokenAddress: 'mada',
    enum: CHAINS_ENUM.MADA,
    hex: '0x7d1',
    scanLink: 'https://explorer-mainnet-cardano-evm.c1.milkomeda.com/tx/_s_',
    nativeTokenLogo:
      'https://static.debank.com/image/chain/logo_url/mada/cdc4b1112c2c5a2757cbda33f4476b7f.png',
    nativeTokenDecimals: 18,
    eip: {
      1559: false,
    },
  },
  [CHAINS_ENUM.CFX]: {
    id: 1030,
    serverId: 'cfx',
    network: '1030',
    name: 'Conflux',
    nativeTokenSymbol: 'CFX',
    nativeTokenAddress: 'cfx',
    enum: CHAINS_ENUM.CFX,
    hex: '0x406',
    scanLink: 'https://evm.confluxscan.io/tx/_s_',
    nativeTokenLogo:
      'https://static.debank.com/image/chain/logo_url/cfx/eab0c7304c6820b48b2a8d0930459b82.png',
    nativeTokenDecimals: 18,
    eip: {
      1559: false,
    },
  },
  [CHAINS_ENUM.BRISE]: {
    id: 32520,
    serverId: 'brise',
    network: '32520',
    name: 'Bitgert',
    nativeTokenSymbol: 'BRISE',
    nativeTokenAddress: 'brise',
    enum: CHAINS_ENUM.BRISE,
    hex: '0x7f08',
    scanLink: 'https://brisescan.com/tx/_s_',
    nativeTokenLogo:
      'https://static.debank.com/image/chain/logo_url/brise/4f6c040cf49f4d8c4eabbad7cd2f4ae4.png',
    nativeTokenDecimals: 18,
    eip: {
      1559: false,
    },
  },
  [CHAINS_ENUM.CKB]: {
    id: 71402,
    serverId: 'ckb',
    network: '71402',
    name: 'Godwoken',
    nativeTokenSymbol: 'CKB',
    nativeTokenAddress: 'ckb',
    enum: CHAINS_ENUM.CKB,
    hex: '0x116ea',
    scanLink: 'https://gw-mainnet-explorer.nervosdao.community/tx/_s_',
    nativeTokenLogo:
      'https://static.debank.com/image/chain/logo_url/ckb/e821893503104870d5e73f56dbd73746.png',
    nativeTokenDecimals: 18,
    eip: {
      1559: false,
    },
  },
  [CHAINS_ENUM.TOMB]: {
    id: 6969,
    serverId: 'tomb',
    network: '6969',
    name: 'Tomb Chain',
    nativeTokenSymbol: 'TOMB',
    nativeTokenAddress: 'tomb',
    enum: CHAINS_ENUM.TOMB,
    hex: '0x1b39',
    scanLink: 'https://tombscout.com/tx/_s_',
    nativeTokenLogo:
      'https://static.debank.com/image/chain/logo_url/tomb/eee88f95c46faa10762514b44655a6a1.png',
    nativeTokenDecimals: 18,
    eip: {
      1559: false,
    },
  },
  [CHAINS_ENUM.PZE]: {
    id: 1101,
    serverId: 'pze',
    network: '1101',
    name: 'Polygon zkEVM',
    nativeTokenSymbol: 'ETH',
    nativeTokenAddress: 'pze',
    enum: CHAINS_ENUM.PZE,
    hex: '0x44d',
    scanLink: 'https://zkevm.polygonscan.com/tx/_s_',
    nativeTokenLogo:
      'https://static.debank.com/image/chain/logo_url/pze/a2276dce2d6a200c6148fb975f0eadd3.png',
    nativeTokenDecimals: 18,
    eip: {
      1559: false,
    },
  },
  [CHAINS_ENUM.ERA]: {
    id: 324,
    serverId: 'era',
    network: '324',
    name: 'zkSync Era',
    nativeTokenSymbol: 'ETH',
    nativeTokenAddress: 'era',
    enum: CHAINS_ENUM.ERA,
    hex: '0x144',
    scanLink: 'https://explorer.zksync.io/tx/_s_',
    nativeTokenLogo:
      'https://static.debank.com/image/chain/logo_url/era/e21641a19fe6b8c5d05337dacae17b6e.png',
    nativeTokenDecimals: 18,
    eip: {
      1559: false,
    },
  },
  [CHAINS_ENUM.EOS]: {
    id: 17777,
    serverId: 'eos',
    network: '17777',
    name: 'EOS EVM',
    nativeTokenSymbol: 'EOS',
    nativeTokenAddress: 'eos',
    enum: CHAINS_ENUM.EOS,
    hex: '0x4571',
    scanLink: 'https://explorer.evm.eosnetwork.com/tx/_s_',
    nativeTokenLogo:
      'https://static.debank.com/image/chain/logo_url/eos/7e3122a9ce6f9d522e6d5519d43b6a72.png',
    nativeTokenDecimals: 18,
    eip: {
      1559: false,
    },
  },
  [CHAINS_ENUM.CORE]: {
    id: 1116,
    serverId: 'core',
    network: '1116',
    name: 'CORE',
    nativeTokenSymbol: 'CORE',
    nativeTokenAddress: 'core',
    enum: CHAINS_ENUM.CORE,
    hex: '0x45c',
    scanLink: 'https://scan.coredao.org/tx/_s_',
    nativeTokenLogo:
      'https://static.debank.com/image/chain/logo_url/core/ccc02f660e5dd410b23ca3250ae7c060.png',
    nativeTokenDecimals: 18,
    eip: {
      1559: false,
    },
  },
  [CHAINS_ENUM.FLR]: {
    id: 14,
    serverId: 'flr',
    network: '14',
    name: 'Flare',
    nativeTokenSymbol: 'FLR',
    nativeTokenAddress: 'flr',
    enum: CHAINS_ENUM.FLR,
    hex: '0xe',
    scanLink: 'https://flare-explorer.flare.network/tx/_s_',
    nativeTokenLogo:
      'https://static.debank.com/image/chain/logo_url/flr/9ee03d5d7036ad9024e81d55596bb4dc.png',
    nativeTokenDecimals: 18,
    eip: {
      1559: false,
    },
  },
  [CHAINS_ENUM.WEMIX]: {
    id: 1111,
    serverId: 'wemix',
    network: '1111',
    name: 'WEMIX',
    nativeTokenSymbol: 'WEMIX',
    nativeTokenAddress: 'wemix',
    enum: CHAINS_ENUM.WEMIX,
    hex: '0x457',
    scanLink: 'https://explorer.wemix.com/tx/_s_',
    nativeTokenLogo:
      'https://static.debank.com/image/chain/logo_url/wemix/d1ba88d1df6cca0b0cb359c36a09c054.png',
    nativeTokenDecimals: 18,
    eip: {
      1559: true,
    },
  },
  [CHAINS_ENUM.METER]: {
    id: 82,
    serverId: 'mtr',
    network: '82',
    name: 'Meter',
    nativeTokenSymbol: 'MTR',
    nativeTokenAddress: 'mtr',
    enum: CHAINS_ENUM.METER,
    hex: '0x52',
    scanLink: 'https://scan.meter.io/tx/_s_',
    nativeTokenLogo:
      'https://static.debank.com/image/chain/logo_url/mtr/2dc6f079f52ca22778eb684e1ce650b3.png',
    nativeTokenDecimals: 18,
    eip: {
      1559: false,
    },
  },
  [CHAINS_ENUM.ETC]: {
    id: 61,
    serverId: 'etc',
    network: '61',
    name: 'Ethereum Classic',
    nativeTokenSymbol: 'ETC',
    nativeTokenAddress: 'etc',
    enum: CHAINS_ENUM.ETC,
    hex: '0x3d',
    scanLink: 'https://blockscout.com/etc/mainnet/tx/_s_',
    nativeTokenLogo:
      'https://static.debank.com/image/chain/logo_url/etc/7ccf90ee6822ab440fb603337da256fa.png',
    nativeTokenDecimals: 18,
    eip: {
      1559: false,
    },
  },
  [CHAINS_ENUM.FSN]: {
    id: 32659,
    serverId: 'fsn',
    network: '32659',
    name: 'Fusion',
    nativeTokenSymbol: 'FSN',
    nativeTokenAddress: 'fsn',
    enum: CHAINS_ENUM.FSN,
    hex: '0x7f93',
    scanLink: 'https://fsnscan.com/tx/_s_',
    nativeTokenLogo:
      'https://static.debank.com/image/chain/logo_url/fsn/047789979f0b5733602b29517753bdf3.png',
    nativeTokenDecimals: 18,
    eip: {
      1559: false,
    },
  },
  [CHAINS_ENUM.PULSE]: {
    id: 369,
    serverId: 'pls',
    network: '369',
    name: 'Pulse',
    nativeTokenSymbol: 'PLS',
    nativeTokenAddress: 'pls',
    enum: CHAINS_ENUM.PULSE,
    hex: '0x171',
    scanLink: 'https://scan.pulsechain.com/tx/_s_',
    nativeTokenLogo:
      'https://static.debank.com/image/chain/logo_url/pls/aa6be079fa9eb568e02150734ebb3db0.png',
    nativeTokenDecimals: 18,
    eip: {
      1559: true,
    },
  },
  [CHAINS_ENUM.ROSE]: {
    id: 42262,
    serverId: 'rose',
    network: '42262',
    name: 'Oasis Emerald',
    nativeTokenSymbol: 'ROSE',
    nativeTokenAddress: 'rose',
    enum: CHAINS_ENUM.ROSE,
    hex: '0xa516',
    scanLink: 'https://explorer.emerald.oasis.dev/tx/_s_',
    nativeTokenLogo:
      'https://static.debank.com/image/chain/logo_url/rose/33ade55b0f3efa10e9eec002c6417257.png',
    nativeTokenDecimals: 18,
    eip: {
      1559: true,
    },
  },
  // [CHAINS_ENUM.RONIN]: {
  //     id: 2020,
  //     serverId: "ron",
  //     network: "2020",
  //     name: "Ronin",
  //     nativeTokenSymbol: "RON",
  //     nativeTokenAddress: "ron",
  //     enum: CHAINS_ENUM.RONIN,
  //     hex: "0x7e4",
  //     scanLink: "https://explorer.roninchain.com/tx/_s_",
  //     nativeTokenLogo: "https://static.debank.com/image/chain/logo_url/ron/6e0f509804bc83bf042ef4d674c1c5ee.png",
  //     nativeTokenDecimals: 18,
  //     eip: {
  //         "1559": false,
  //     },
  // },
  [CHAINS_ENUM.OAS]: {
    id: 248,
    serverId: 'oas',
    network: '248',
    name: 'Oasys',
    nativeTokenSymbol: 'OAS',
    nativeTokenAddress: 'oas',
    enum: CHAINS_ENUM.OAS,
    hex: '0xf8',
    scanLink: 'https://scan.oasys.games/tx/_s_',
    nativeTokenLogo:
      'https://static.debank.com/image/chain/logo_url/oas/69e424154c30984ff4d5ba916591ac2a.png',
    nativeTokenDecimals: 18,
    eip: {
      1559: true,
    },
  },
  [CHAINS_ENUM.ZORA]: {
    id: 7777777,
    serverId: 'zora',
    network: '7777777',
    name: 'Zora',
    nativeTokenSymbol: 'ETH',
    nativeTokenAddress: 'zora',
    enum: CHAINS_ENUM.ZORA,
    hex: '0x76adf1',
    scanLink: 'https://explorer.zora.energy/tx/_s_',
    nativeTokenLogo:
      'https://static.debank.com/image/token/logo_url/eth/935ae4e4d1d12d59a99717a24f2540b5.png',
    nativeTokenDecimals: 18,
    eip: {
      1559: false,
    },
  },
  [CHAINS_ENUM.LINEA]: {
    id: 59144,
    serverId: 'linea',
    network: '59144',
    name: 'Linea',
    nativeTokenSymbol: 'ETH',
    nativeTokenAddress: 'linea',
    enum: CHAINS_ENUM.LINEA,
    hex: '0xe708',
    scanLink: 'https://lineascan.build/tx/_s_',
    nativeTokenLogo:
      'https://static.debank.com/image/token/logo_url/eth/935ae4e4d1d12d59a99717a24f2540b5.png',
    nativeTokenDecimals: 18,
    eip: {
      1559: false,
    },
  },
  [CHAINS_ENUM.BASE]: {
    id: 8453,
    serverId: 'base',
    network: '8453',
    name: 'Base',
    nativeTokenSymbol: 'ETH',
    nativeTokenAddress: 'base',
    enum: CHAINS_ENUM.LINEA,
    hex: '0x2105',
    scanLink: 'https://basescan.org/tx/_s_',
    nativeTokenLogo:
      'https://static.debank.com/image/token/logo_url/eth/935ae4e4d1d12d59a99717a24f2540b5.png',
    nativeTokenDecimals: 18,
    eip: {
      1559: false,
    },
  },
  [CHAINS_ENUM.GETH]: {
    id: 5,
    serverId: 'geth',
    network: '5',
    name: 'Ethereum Goerli',
    nativeTokenSymbol: 'GoerliETH',
    nativeTokenAddress: 'geth',
    enum: CHAINS_ENUM.GETH,
    hex: '0x5',
    scanLink: 'https://goerli.etherscan.io/tx/_s_',
    nativeTokenLogo:
      'https://static.debank.com/image/token/logo_url/eth/935ae4e4d1d12d59a99717a24f2540b5.png',
    nativeTokenDecimals: 18,
    eip: {
      1559: true,
    },
    isTestnet: true,
  },
  [CHAINS_ENUM.GARBITRUM]: {
    id: 421613,
    serverId: 'garb',
    name: 'Arbitrum Goerli',
    enum: CHAINS_ENUM.GARBITRUM,
    hex: '0x66eed',
    network: '421613',
    nativeTokenSymbol: 'GoerliETH',
    nativeTokenAddress: 'garb',
    scanLink: 'https://testnet.arbiscan.io/tx/_s_',
    nativeTokenLogo:
      'https://static.debank.com/image/arb_token/logo_url/arb/d61441782d4a08a7479d54aea211679e.png',
    nativeTokenDecimals: 18,
    eip: {
      1559: true,
    },
    isTestnet: true,
  },
  [CHAINS_ENUM.CGNOSIS]: {
    id: 10200,
    name: 'Gnosis Chiado',
    serverId: 'cxdai',
    hex: '0x27d8',
    enum: CHAINS_ENUM.CGNOSIS,
    network: '10200',
    nativeTokenSymbol: 'ChiadoXDAI',
    nativeTokenAddress: 'cxdai',
    scanLink: 'https://gnosis-chiado.blockscout.com/tx/_s_',
    nativeTokenLogo:
      'https://static.debank.com/image/xdai_token/logo_url/xdai/1207e67652b691ef3bfe04f89f4b5362.png',
    nativeTokenDecimals: 18,
    eip: {
      1559: true,
    },
    isTestnet: true,
  },
  [CHAINS_ENUM.MANTLE]: {
    id: 5000,
    name: 'Mantle',
    serverId: 'mnt',
    hex: '0x1388',
    enum: CHAINS_ENUM.MANTLE,
    network: '5000',
    nativeTokenSymbol: 'MNT',
    nativeTokenAddress: 'mnt',
    scanLink: 'https://explorer.mantle.xyz/tx/_s_',
    nativeTokenLogo:
      'https://static.debank.com/image/chain/logo_url/mnt/0af11a52431d60ded59655c7ca7e1475.png',
    nativeTokenDecimals: 18,
    eip: {
      1559: true,
    },
  },
  [CHAINS_ENUM.TENET]: {
    id: 1559,
    name: 'Tenet',
    serverId: 'tenet',
    hex: '0x617',
    enum: CHAINS_ENUM.TENET,
    network: '1559',
    nativeTokenSymbol: 'TENET',
    nativeTokenAddress: 'tenet',
    scanLink: 'https://tenetscan.io/tx/_s_',
    nativeTokenLogo:
      'https://static.debank.com/image/chain/logo_url/tenet/803be22e467ee9a5abe00d69a9c3ea4f.png',
    nativeTokenDecimals: 18,
    eip: {
      1559: false,
    },
  },
  [CHAINS_ENUM.TBSC]: {
    id: 97,
    name: 'BNB Testnet',
    serverId: 'tbsc',
    hex: '0x61',
    enum: CHAINS_ENUM.TBSC,
    network: '97',
    nativeTokenSymbol: 'TestnetBNB',
    nativeTokenAddress: 'tbsc',
    scanLink: 'https://testnet.bscscan.com/tx/_s_',
    nativeTokenLogo:
      'https://static.debank.com/image/bsc_token/logo_url/bsc/8bfdeaa46fe9be8f5cd43a53b8d1eea1.png',
    nativeTokenDecimals: 18,
    eip: {
      1559: false,
    },
    isTestnet: true,
  },
  [CHAINS_ENUM.MPOLYGON]: {
    id: 80001,
    serverId: 'mmatic',
    name: 'Polygon Mumbai',
    hex: '0x13881',
    enum: CHAINS_ENUM.MPOLYGON,
    network: '80001',
    nativeTokenSymbol: 'MumbaiMATIC',
    nativeTokenAddress: 'mmatic',
    nativeTokenDecimals: 18,
    scanLink: 'https://mumbai.polygonscan.com/tx/_s_',
    nativeTokenLogo:
      'https://static.debank.com/image/matic_token/logo_url/matic/e5a8a2860ba5cf740a474dcab796dc63.png',
    eip: {
      1559: true,
    },
    isTestnet: true,
  },
  [CHAINS_ENUM.GOP]: {
    id: 420,
    serverId: 'gop',
    network: '420',
    name: 'Optimism Goerli',
    enum: CHAINS_ENUM.GOP,
    hex: '0x1a4',
    scanLink: 'https://goerli-optimism.etherscan.io/tx/_s_',
    nativeTokenSymbol: 'GoerliETH',
    nativeTokenAddress: 'gop',
    nativeTokenLogo:
      'https://static.debank.com/image/op_token/logo_url/op/d61441782d4a08a7479d54aea211679e.png',
    nativeTokenDecimals: 18,
    eip: {
      1559: false,
    },
    isTestnet: true,
  },
  [CHAINS_ENUM.GBOBA]: {
    id: 2888,
    serverId: 'gboba',
    network: '2888',
    name: 'Boba Goerli',
    nativeTokenSymbol: 'GoerliETH',
    nativeTokenAddress: 'gboba',
    enum: CHAINS_ENUM.GBOBA,
    hex: '0xb48',
    scanLink: 'https://testnet.bobascan.com/tx/_s_',
    nativeTokenLogo:
      'https://static.debank.com/image/token/logo_url/eth/935ae4e4d1d12d59a99717a24f2540b5.png',
    nativeTokenDecimals: 18,
    eip: {
      1559: false,
    },
    isTestnet: true,
  },
  [CHAINS_ENUM.GBASE]: {
    id: 84531,
    serverId: 'gbase',
    network: '84531',
    name: 'Base Goerli',
    nativeTokenSymbol: 'GoerliETH',
    nativeTokenAddress: 'gbase',
    enum: CHAINS_ENUM.GBASE,
    hex: '0x14a33',
    scanLink: 'https://goerli.basescan.org/tx/_s_',
    nativeTokenLogo:
      'https://static.debank.com/image/token/logo_url/eth/935ae4e4d1d12d59a99717a24f2540b5.png',
    nativeTokenDecimals: 18,
    eip: {
      1559: false,
    },
    isTestnet: true,
  },
  [CHAINS_ENUM.GLINEA]: {
    id: 59140,
    serverId: 'glinea',
    network: '59140',
    name: 'Linea Goerli',
    nativeTokenSymbol: 'GoerliETH',
    nativeTokenAddress: 'glinea',
    enum: CHAINS_ENUM.GLINEA,
    hex: '0xe704',
    scanLink: 'https://explorer.goerli.linea.build/tx/_s_',
    nativeTokenLogo:
      'https://static.debank.com/image/token/logo_url/eth/935ae4e4d1d12d59a99717a24f2540b5.png',
    nativeTokenDecimals: 18,
    eip: {
      1559: true,
    },
    isTestnet: true,
  },
  [CHAINS_ENUM.TFTM]: {
    id: 4002,
    serverId: 'tftm',
    network: '4002',
    name: 'Fantom Testnet',
    nativeTokenSymbol: 'TestnetFTM',
    nativeTokenAddress: 'tftm',
    enum: CHAINS_ENUM.TFTM,
    hex: '0xfa2',
    scanLink: 'https://testnet.ftmscan.com/tx/_s_',
    nativeTokenLogo:
      'https://static.debank.com/image/chain/logo_url/tftm/d2f3315db5ff227373d10e6b68968ee9.png',
    nativeTokenDecimals: 18,
    eip: {
      1559: true,
    },
    isTestnet: true,
  },
  [CHAINS_ENUM.TLYX]: {
    id: 4201,
    serverId: 'tlyx',
    network: '4201',
    name: 'LUKSO Testnet',
    nativeTokenSymbol: 'TestnetLYX',
    nativeTokenAddress: 'tlyx',
    enum: CHAINS_ENUM.TLYX,
    hex: '0x1069',
    scanLink: 'https://explorer.execution.testnet.lukso.network/tx/_s_',
    nativeTokenLogo:
      'https://static.debank.com/image/chain/logo_url/tlyx/52d17f7faf8e52eaf64fda2ab8cd06c4.png',
    nativeTokenDecimals: 18,
    eip: {
      1559: true,
    },
    isTestnet: true,
  },
  [CHAINS_ENUM.LYX]: {
    id: 42,
    serverId: 'lyx',
    network: '42',
    name: 'LUKSO',
    nativeTokenSymbol: 'LYX',
    nativeTokenAddress: 'lyx',
    enum: CHAINS_ENUM.LYX,
    hex: '0x2a',
    scanLink: 'https://explorer.execution.mainnet.lukso.network/tx/_s_',
    nativeTokenLogo:
      'https://static.debank.com/image/chain/logo_url/lyx/dbe6eef57e66817e61297d9b188248ed.png',
    nativeTokenDecimals: 18,
    eip: {
      1559: true,
    },
    isTestnet: false,
  },
  [CHAINS_ENUM.TDEBANK]: {
    id: 2021398,
    serverId: 'tdbk',
    network: '2021398',
    name: 'DeBank Testnet',
    nativeTokenSymbol: 'USD',
    nativeTokenAddress: 'tdbk',
    enum: CHAINS_ENUM.TDEBANK,
    hex: '0x1ed816',
    scanLink: 'https://explorer.testnet.debank.com/tx/_s_',
    nativeTokenLogo:
      'https://static.debank.com/image/tdbk_token/logo_url/tdbk/ca33ab4b12ff60ed4b571334a251d45e.png',
    nativeTokenDecimals: 18,
    eip: {
      1559: true,
    },
    isTestnet: true,
  },
  [CHAINS_ENUM.TMNT]: {
    id: 5001,
    serverId: 'tmnt',
    network: '5001',
    name: 'Mantle Testnet',
    nativeTokenSymbol: 'TestnetMNT',
    nativeTokenAddress: 'tmnt',
    enum: CHAINS_ENUM.TMNT,
    hex: '0x1389',
    scanLink: 'https://explorer.testnet.mantle.xyz/tx/_s_',
    nativeTokenLogo:
      'https://static.debank.com/image/chain/logo_url/tmnt/4c5f5bc84f7cbfe80b6be29021898a51.png',
    nativeTokenDecimals: 18,
    eip: {
      1559: false,
    },
    isTestnet: true,
  },
  [CHAINS_ENUM.OPBNB]: {
    id: 204,
    serverId: 'opbnb',
    network: '204',
    name: 'opBNB',
    nativeTokenSymbol: 'BNB',
    nativeTokenAddress: 'opbnb',
    enum: CHAINS_ENUM.OPBNB,
    hex: '0xcc',
    scanLink: 'https://mainnet.opbnbscan.com/tx/_s_',
    nativeTokenLogo:
      'https://static.debank.com/image/bsc_token/logo_url/bsc/8bfdeaa46fe9be8f5cd43a53b8d1eea1.png',
    nativeTokenDecimals: 18,
    eip: {
      1559: false,
    },
    isTestnet: false,
  },
  [CHAINS_ENUM.GERA]: {
    id: 280,
    serverId: 'gera',
    network: '280',
    name: 'zkSync Era Goerli',
    nativeTokenSymbol: 'GoerliETH',
    nativeTokenAddress: 'gera',
    enum: CHAINS_ENUM.GERA,
    hex: '0x118',
    scanLink: 'https://goerli.explorer.zksync.io/tx/_s_',
    nativeTokenLogo:
      'https://static.debank.com/image/token/logo_url/eth/935ae4e4d1d12d59a99717a24f2540b5.png',
    nativeTokenDecimals: 18,
    eip: {
      1559: false,
    },
    isTestnet: true,
  },
  [CHAINS_ENUM.PMANTA]: {
    id: 3441005,
    serverId: 'pmanta',
    network: '3441005',
    name: 'Manta Pacific Testnet',
    nativeTokenSymbol: 'PacificETH',
    nativeTokenAddress: 'pmanta',
    enum: CHAINS_ENUM.PMANTA,
    hex: '0x34816d',
    scanLink: 'https://pacific-explorer.manta.network/tx/_s_',
    nativeTokenLogo:
      'https://static.debank.com/image/token/logo_url/eth/935ae4e4d1d12d59a99717a24f2540b5.png',
    nativeTokenDecimals: 18,
    eip: {
      1559: true,
    },
    isTestnet: true,
  },
  [CHAINS_ENUM.TOPBNB]: {
    id: 5611,
    serverId: 'topbnb',
    network: '5611',
    name: 'opBNB Testnet',
    nativeTokenSymbol: 'TestnetBNB',
    nativeTokenAddress: 'topbnb',
    enum: CHAINS_ENUM.TOPBNB,
    hex: '0x15eb',
    scanLink: 'https://opbnbscan.com/tx/_s_',
    nativeTokenLogo:
      'https://static.debank.com/image/coin/logo_url/bnb/9784283a36f23a58982fc964574ea530.png',
    nativeTokenDecimals: 18,
    eip: {
      1559: false,
    },
    isTestnet: true,
  },
  [CHAINS_ENUM.TTENET]: {
    id: 155,
    name: 'Tenet Testnet',
    serverId: 'ttenet',
    hex: '0x9b',
    enum: CHAINS_ENUM.TTENET,
    network: '155',
    nativeTokenSymbol: 'TestnetTENET',
    nativeTokenAddress: 'ttenet',
    scanLink: 'https://testnet.tenetscan.io/tx/_s_',
    nativeTokenLogo:
      'https://static.debank.com/image/tenet_token/logo_url/tenet/2da9b626102a7de9625aaf753cfac321.png',
    nativeTokenDecimals: 18,
    eip: {
      1559: false,
    },
    isTestnet: true,
  },
  [CHAINS_ENUM.LOOT]: {
    id: 5151706,
    name: 'Loot',
    serverId: 'loot',
    hex: '0x4e9bda',
    enum: CHAINS_ENUM.LOOT,
    network: '5151706',
    nativeTokenSymbol: 'AGLD',
    nativeTokenAddress: 'loot',
    scanLink: 'https://explorer.lootchain.com/tx/_s_',
    nativeTokenLogo:
      'https://static.debank.com/image/loot_token/logo_url/loot/a6c0dc128d515e2d32526075decae9ec.png',
    nativeTokenDecimals: 18,
    eip: {
      1559: false,
    },
    isTestnet: false,
  },
  [CHAINS_ENUM.TLOOT]: {
    id: 9088912,
    name: 'Loot Testnet',
    serverId: 'tloot',
    hex: '0x8aaf90',
    enum: CHAINS_ENUM.TLOOT,
    network: '9088912',
    nativeTokenSymbol: 'TestnetAGLD',
    nativeTokenAddress: 'tloot',
    scanLink: 'https://testnet.explorer.lootchain.com/tx/_s_',
    nativeTokenLogo:
      'https://static.debank.com/image/tloot_token/logo_url/tloot/a6c0dc128d515e2d32526075decae9ec.png',
    nativeTokenDecimals: 18,
    eip: {
      1559: false,
    },
    isTestnet: true,
  },
  [CHAINS_ENUM.SETH]: {
    id: 11155111,
    serverId: 'seth',
    network: '11155111',
    name: 'Ethereum Sepolia',
    nativeTokenSymbol: 'SepoliaETH',
    nativeTokenAddress: 'seth',
    enum: CHAINS_ENUM.SETH,
    hex: '0xaa36a7',
    scanLink: 'https://sepolia.etherscan.io/tx/_s_',
    nativeTokenLogo:
      'https://static.debank.com/image/seth_token/logo_url/seth/389dd9a835250219889e01d5a31a75f1.png',
    nativeTokenDecimals: 18,
    eip: {
      1559: true,
    },
    isTestnet: true,
  },
  [CHAINS_ENUM.SSCROLL]: {
    id: 534351,
    serverId: 'sscrl',
    network: '534351',
    name: 'Scroll Sepolia',
    nativeTokenSymbol: 'SepoliaETH',
    nativeTokenAddress: 'sscrl',
    enum: CHAINS_ENUM.SSCROLL,
    hex: '0x8274f',
    scanLink: 'https://sepolia-blockscout.scroll.io/tx/_s_',
    nativeTokenLogo:
      'https://static.debank.com/image/sscrl_token/logo_url/sscrl/389dd9a835250219889e01d5a31a75f1.png',
    nativeTokenDecimals: 18,
    eip: {
      1559: false,
    },
    isTestnet: true,
  },
  [CHAINS_ENUM.AZETA]: {
    id: 7001,
    serverId: 'azeta',
    network: '7001',
    name: 'ZetaChain Athens-3 Testnet',
    nativeTokenSymbol: 'AthensZETA',
    nativeTokenAddress: 'azeta',
    enum: CHAINS_ENUM.AZETA,
    hex: '0x1b59',
    scanLink: 'https://zetachain-athens-3.blockscout.com/tx/_s_',
    nativeTokenLogo:
      'https://static.debank.com/image/azeta_token/logo_url/azeta/67a3cca2e34f8ff6fadfd339dac7a207.png',
    nativeTokenDecimals: 18,
    eip: {
      1559: false,
    },
    isTestnet: true,
  },
};
export const CHAINS_RAW_LIST = Object.values(CHAINS_RAW);
