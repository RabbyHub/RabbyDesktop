export var CHAINS_ENUM;
(function (CHAINS_ENUM) {
  CHAINS_ENUM.ETH = 'ETH';
  CHAINS_ENUM.BSC = 'BSC';
  CHAINS_ENUM.GNOSIS = 'GNOSIS';
  CHAINS_ENUM.HECO = 'HECO';
  CHAINS_ENUM.POLYGON = 'POLYGON';
  CHAINS_ENUM.FTM = 'FTM';
  CHAINS_ENUM.OKT = 'OKT';
  CHAINS_ENUM.ARBITRUM = 'ARBITRUM';
  CHAINS_ENUM.AVAX = 'AVAX';
  CHAINS_ENUM.OP = 'OP';
  CHAINS_ENUM.CELO = 'CELO';
  CHAINS_ENUM.MOVR = 'MOVR';
  CHAINS_ENUM.CRO = 'CRO';
  CHAINS_ENUM.BOBA = 'BOBA';
  CHAINS_ENUM.METIS = 'METIS';
  CHAINS_ENUM.BTT = 'BTT';
  CHAINS_ENUM.AURORA = 'AURORA';
  CHAINS_ENUM.MOBM = 'MOBM';
  CHAINS_ENUM.SBCH = 'SBCH';
  CHAINS_ENUM.FUSE = 'FUSE';
  CHAINS_ENUM.HMY = 'HMY';
  CHAINS_ENUM.PALM = 'PALM';
  CHAINS_ENUM.ASTAR = 'ASTAR';
  CHAINS_ENUM.SDN = 'SDN';
  CHAINS_ENUM.KLAY = 'KLAY';
  CHAINS_ENUM.IOTX = 'IOTX';
  CHAINS_ENUM.RSK = 'RSK';
  CHAINS_ENUM.WAN = 'WAN';
  CHAINS_ENUM.KCC = 'KCC';
  CHAINS_ENUM.SGB = 'SGB';
  CHAINS_ENUM.EVMOS = 'EVMOS';
  CHAINS_ENUM.DFK = 'DFK';
  CHAINS_ENUM.TLOS = 'TLOS';
  CHAINS_ENUM.SWM = 'SWM';
  CHAINS_ENUM.NOVA = 'NOVA';
  CHAINS_ENUM.CANTO = 'CANTO';
  CHAINS_ENUM.DOGE = 'DOGE';
  CHAINS_ENUM.STEP = 'STEP';
  CHAINS_ENUM.KAVA = 'KAVA';
  CHAINS_ENUM.MADA = 'MADA';
  CHAINS_ENUM.CFX = 'CFX';
  CHAINS_ENUM.BRISE = 'BRISE';
  CHAINS_ENUM.CKB = 'CKB';
  CHAINS_ENUM.TOMB = 'TOMB';
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
    thridPartyRPC:
      'https://eth-mainnet.alchemyapi.io/v2/hVcflvG3Hp3ufTgyfj-s9govLX5OYluf',
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
    thridPartyRPC: 'https://bsc-dataseed1.binance.org',
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
    thridPartyRPC: 'https://rpc.gnosischain.com',
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
    thridPartyRPC: 'https://polygon-rpc.com',
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
    thridPartyRPC: 'https://rpc.ftm.tools',
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
    thridPartyRPC: 'https://exchainrpc.okex.org',
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
    thridPartyRPC: 'https://http-mainnet.hecochain.com',
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
    thridPartyRPC: 'https://api.avax.network/ext/bc/C/rpc',
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
    thridPartyRPC: 'https://arb1.arbitrum.io/rpc',
    eip: {
      1559: false,
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
    thridPartyRPC: 'https://mainnet.optimism.io',
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
    thridPartyRPC: 'https://forno.celo.org',
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
    thridPartyRPC: 'https://rpc.moonriver.moonbeam.network',
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
    thridPartyRPC: 'https://evm-cronos.crypto.org',
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
    thridPartyRPC: 'https://mainnet.boba.network/',
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
    thridPartyRPC: 'https://andromeda.metis.io/?owner=1088',
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
    thridPartyRPC: 'https://rpc.bittorrentchain.io/',
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
    thridPartyRPC: 'https://mainnet.aurora.dev',
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
    thridPartyRPC: 'https://rpc.api.moonbeam.network',
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
    thridPartyRPC: 'https://rpc-mainnet.smartbch.org',
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
    thridPartyRPC: 'https://a.api.s0.t.hmny.io',
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
    thridPartyRPC: 'https://rpc.fuse.io',
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
    thridPartyRPC: 'https://rpc.astar.network:8545',
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
    thridPartyRPC:
      'https://palm-mainnet.infura.io/v3/da5fbfafcca14b109e2665290681e267',
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
    thridPartyRPC: 'https://evm.shiden.astar.network',
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
    thridPartyRPC: 'https://public-node-api.klaytnapi.com/v1/cypress',
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
    thridPartyRPC: 'https://public-node.rsk.co',
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
    thridPartyRPC: 'https://babel-api.mainnet.iotex.io',
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
    thridPartyRPC: 'https://rpc-mainnet.kcc.network',
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
    thridPartyRPC: 'https://gwan-ssl.wandevs.org:56891',
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
    thridPartyRPC: 'https://songbird.towolabs.com/rpc',
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
    thridPartyRPC: 'https://eth.bd.evmos.org:8545',
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
    thridPartyRPC: 'https://subnets.avax.network/defi-kingdoms/dfk-chain/rpc',
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
    thridPartyRPC: 'https://mainnet.telos.net/evm',
    eip: {
      1559: false,
    },
  },
  [CHAINS_ENUM.SWM]: {
    id: 73772,
    serverId: 'swm',
    network: '73772',
    name: 'Swimmer',
    nativeTokenSymbol: 'TUS',
    nativeTokenAddress: 'swm',
    enum: CHAINS_ENUM.SWM,
    hex: '0x1202c',
    scanLink: 'https://subnets.avax.network/swimmer/mainnet/explorer/tx/_s_',
    nativeTokenLogo:
      'https://static.debank.com/image/chain/logo_url/swm/361526e901cb506ef7074c3678ce769a.png',
    nativeTokenDecimals: 18,
    thridPartyRPC: 'https://avax-cra-rpc.gateway.pokt.network',
    eip: {
      1559: true,
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
    scanLink: 'https://nova-explorer.arbitrum.io/tx/_s_',
    nativeTokenLogo:
      'https://static.debank.com/image/chain/logo_url/nova/06eb2b7add8ba443d5b219c04089c326.png',
    nativeTokenDecimals: 18,
    thridPartyRPC: 'https://nova.arbitrum.io/rpc',
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
    scanLink: 'https://evm.explorer.canto.io/tx/_s_',
    nativeTokenLogo:
      'https://static.debank.com/image/chain/logo_url/canto/47574ef619e057d2c6bbce1caba57fb6.png',
    nativeTokenDecimals: 18,
    thridPartyRPC: 'https://canto.evm.chandrastation.com',
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
    thridPartyRPC: 'https://rpc.dogechain.dog',
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
    thridPartyRPC: 'https://rpc.step.network',
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
    thridPartyRPC: 'https://evm.kava.io',
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
    thridPartyRPC: 'https://rpc-mainnet-cardano-evm.c1.milkomeda.com',
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
    thridPartyRPC: 'https://evm.confluxrpc.com',
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
    thridPartyRPC: 'https://mainnet-rpc.brisescan.com',
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
    thridPartyRPC: 'https://v1.mainnet.godwoken.io/rpc',
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
    thridPartyRPC: 'https://rpc.tombchain.com',
    eip: {
      1559: false,
    },
  },
};
export const CHAINS_RAW_LIST = Object.values(CHAINS_RAW);
