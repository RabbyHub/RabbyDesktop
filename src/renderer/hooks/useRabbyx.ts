import { useCallback, useEffect, useMemo, useState } from 'react';
import { CHAINS } from '@debank/common';
import { getConnectedSites, walletController } from '../ipcRequest/rabbyx';

export function useCurrentAccount() {
  const [currentAccount, setCurrentAccount] = useState<RabbyAccount | null>(
    null
  );

  useMemo(() => {
    if (currentAccount?.address) {
      walletController
        .getAlianName(currentAccount?.address)
        .then((alianName) => {
          setCurrentAccount((pre) => (pre ? { ...pre, alianName } : pre));
        });
    }
  }, [currentAccount?.address]);

  useEffect(() => {
    walletController.getCurrentAccount().then((account) => {
      setCurrentAccount((pre) => ({ ...pre, ...account }));
    });

    return window.rabbyDesktop.ipcRenderer.on(
      '__internal_push:rabbyx:session-broadcast-forward-to-main',
      (payload) => {
        switch (payload.event) {
          default:
            break;
          case 'unlock':
          case 'rabby:chainChanged': {
            walletController.getCurrentAccount().then((account) => {
              setCurrentAccount((pre) => ({ ...pre, ...account }));
            });
          }
        }
      }
    );
  }, []);

  return currentAccount;
}

function transformConnectInfo(
  input: IConnectedSiteInfo
): IConnectedSiteToDisplay {
  return {
    origin: input.origin,
    isConnected: input.isConnected,
    chain: input.chain,
    chainId: (CHAINS[input.chain]?.hex || '0x1') as HexValue,
    chainName: CHAINS[input.chain]?.name || '',
  };
}

export function useConnectedSite(currentOrigin?: string) {
  const [connectedSiteMap, setConnectedSiteMap] = useState<
    Record<string, IConnectedSiteToDisplay & { chainName: string }>
  >({});

  const fetchConnectedSite = useCallback(async () => {
    const sites = await getConnectedSites();

    setConnectedSiteMap((prev) => {
      return sites.reduce((acc, site) => {
        acc[site.origin] = {
          ...prev[site.origin],
          ...transformConnectInfo(site),
        };
        return acc;
      }, prev);
    });
  }, []);

  useEffect(() => {
    fetchConnectedSite();

    return window.rabbyDesktop.ipcRenderer.on(
      '__internal_push:rabbyx:session-broadcast-forward-to-main',
      (payload) => {
        switch (payload.event) {
          default:
            break;
          case 'rabby:chainChanged': {
            const data: IConnectedSiteToDisplay = {
              origin: payload.origin!,
              isConnected: !!payload.data?.hex,
              chain: payload.data?.chain || 'ETH',
              chainId: payload.data?.hex || '0x1',
              chainName: payload.data?.name || '',
            };
            setConnectedSiteMap((prev) => ({
              ...prev,
              [data.origin]: { ...data },
            }));
          }
        }
      }
    );
  }, [fetchConnectedSite]);

  const currentConnectedSite = useMemo(() => {
    return connectedSiteMap?.[currentOrigin!] || null;
  }, [connectedSiteMap, currentOrigin]);

  return {
    currentConnectedSite,
    connectedSiteMap,
    fetchConnectedSite,
  };
}
