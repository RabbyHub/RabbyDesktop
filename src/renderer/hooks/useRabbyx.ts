import { useCallback, useEffect, useState } from 'react';
import { getConnectedSites, walletController } from '../ipcRequest/rabbyx';

export function useCurrentAccount() {
  const [currentAccount, setCurrentAccount] = useState<RabbyAccount | null>(
    null
  );

  useEffect(() => {
    walletController.getCurrentAccount().then((account) => {
      setCurrentAccount(account);
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
              setCurrentAccount(account);
            });
          }
        }
      }
    );
  }, []);

  return currentAccount;
}

export function useConnectedSite() {
  const [connectedSiteMap, setConnectedSiteMap] = useState<
    Record<string, IConnectedSiteToDisplay & { chainName: string }>
  >({});

  const fetchConnectedSite = useCallback(async () => {
    const sites = await getConnectedSites();

    setConnectedSiteMap((prev) => {
      return sites.reduce((acc, site) => {
        acc[site.origin] = {
          ...prev[site.origin],
          ...site,
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

  return {
    connectedSiteMap,
    fetchConnectedSite,
  };
}
