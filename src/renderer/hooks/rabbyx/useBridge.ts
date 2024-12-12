import { walletOpenapi } from '@/renderer/ipcRequest/rabbyx';
import { findChainByServerID } from '@/renderer/utils/chain';
import { BridgeAggregator } from '@rabby-wallet/rabby-api/dist/types';
import { atom, useAtomValue } from 'jotai';

const bridgeSupportChainsAtom = atom<CHAINS_ENUM[]>([]);

bridgeSupportChainsAtom.onMount = (setAtom) => {
  walletOpenapi.getBridgeSupportChainV2().then(async (s) => {
    const chains = await s;
    if (chains.length) {
      const data = chains
        .map((chain) => findChainByServerID(chain)?.enum)
        .filter((chain) => !!chain);
      setAtom(data);
    }
  });
};

export const useBridgeSupportChains = () =>
  useAtomValue(bridgeSupportChainsAtom);

const bridgeAggregatorsListAtom = atom<BridgeAggregator[]>([]);

bridgeAggregatorsListAtom.onMount = (setAtom) => {
  walletOpenapi.getBridgeAggregatorList().then(async (s) => {
    const aggregatorsList = await s;
    setAtom(aggregatorsList);
  });
};

export const useBridgeAggregatorsList = () =>
  useAtomValue(bridgeAggregatorsListAtom);
