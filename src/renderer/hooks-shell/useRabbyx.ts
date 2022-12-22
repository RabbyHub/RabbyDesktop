import { useCallback, useEffect, useState } from 'react';
import { getConnectedSites } from '../ipcRequest/rabbyx';

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
    const dispose = window.rabbyDesktop.ipcRenderer.on(
      '__internal_push:rabby:chainChanged',
      (data) => {
        setConnectedSiteMap((prev) => ({
          ...prev,
          [data.origin]: { ...data },
        }));
      }
    );

    return () => {
      dispose?.();
    };
  }, []);

  return {
    connectedSiteMap,
    fetchConnectedSite,
  };
}
