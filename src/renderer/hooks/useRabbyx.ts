import { useCallback, useEffect, useMemo } from 'react';
import { CHAINS, CHAINS_LIST } from '@debank/common';
import { atom, useAtom } from 'jotai';
import { walletController } from '../ipcRequest/rabbyx';

const DEFAULT_ETH_CHAIN = CHAINS_LIST.find((chain) => chain.enum === 'ETH')!;

function transformConnectInfo(
  input: IConnectedSiteInfo
): IConnectedSiteToDisplay {
  const chain = CHAINS[input.chain] || DEFAULT_ETH_CHAIN;

  return {
    origin: input.origin,
    isConnected: input.isConnected,
    chain: input.chain,
    chainHex: chain.hex,
    chainName: chain.name,
  };
}

const connectedSiteMapAtom = atom(
  {} as Record<string, IConnectedSiteToDisplay>
);

export function useConnectedSite(currentOrigin?: string) {
  const [connectedSiteMap, setConnectedSiteMap] = useAtom(connectedSiteMapAtom);

  const fetchConnectedSite = useCallback(async () => {
    const sites = await walletController.getConnectedSites();

    setConnectedSiteMap((prev) => {
      return sites.reduce((acc, site) => {
        acc[site.origin] = {
          ...prev[site.origin],
          ...transformConnectInfo(site),
        };
        return acc;
      }, prev);
    });
  }, [setConnectedSiteMap]);

  useEffect(() => {
    fetchConnectedSite();

    return window.rabbyDesktop.ipcRenderer.on(
      '__internal_push:rabbyx:session-broadcast-forward-to-main',
      (payload) => {
        switch (payload.event) {
          default:
            break;
          case 'rabby:chainChanged': {
            const chain =
              CHAINS_LIST.find(
                (chainItem) =>
                  chainItem.hex === payload.data?.hex ||
                  chainItem.name === payload.data?.name ||
                  chainItem.enum === payload.data?.enum
              ) || DEFAULT_ETH_CHAIN;

            const data: IConnectedSiteToDisplay = {
              origin: payload.origin!,
              isConnected: !!payload.data?.hex,
              chain: chain.enum,
              chainHex: chain.hex,
              chainName: chain.name,
            };
            setConnectedSiteMap((prev) => ({
              ...prev,
              [data.origin]: { ...data },
            }));
          }
        }
      }
    );
  }, [setConnectedSiteMap, fetchConnectedSite]);

  const currentConnectedSite = useMemo(() => {
    return connectedSiteMap?.[currentOrigin!] || null;
  }, [connectedSiteMap, currentOrigin]);

  return {
    currentConnectedSite,
    connectedSiteMap,
    fetchConnectedSite,
  };
}
