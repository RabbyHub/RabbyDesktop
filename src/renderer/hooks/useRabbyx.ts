import { formatDappHttpOrigin } from '@/isomorphic/dapp';
import { canoicalizeDappUrl } from '@/isomorphic/url';
import { atom, useAtom } from 'jotai';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useEventListener } from 'ahooks';
import { useEffectOnce } from 'react-use';
import { getLastOpenOriginByOrigin } from '../ipcRequest/dapps';
import { walletController } from '../ipcRequest/rabbyx';
import { DEFAULT_ETH_CHAIN, findChain, updateChainStore } from '../utils/chain';
import { useMessageForwarded } from './useViewsMessage';

function transformConnectInfo(
  input: IConnectedSiteInfo
): IConnectedSiteToDisplay {
  const chain =
    findChain({
      enum: input.chain,
    }) || DEFAULT_ETH_CHAIN;

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

  const fetchConnectedSite = useCallback(
    async (cleanup = false) => {
      const sites = await walletController.getConnectedSites();

      setConnectedSiteMap((prev) => {
        return sites.reduce(
          (acc, site) => {
            acc[site.origin] = {
              ...prev[site.origin],
              ...transformConnectInfo(site),
            };
            return acc;
          },
          cleanup ? {} : { ...prev }
        );
      });
    },
    [setConnectedSiteMap]
  );

  useMessageForwarded(
    {
      type: 'refreshConnectedSiteMap',
      // this hooks is used only in mainWindow now, but
      // we still declare the targetView here for future use
      targetView: '*',
    },
    () => {
      fetchConnectedSite(true);
    }
  );

  useEffect(() => {
    fetchConnectedSite();

    return window.rabbyDesktop.ipcRenderer.on(
      '__internal_push:rabbyx:session-broadcast-forward-to-desktop',
      (payload) => {
        switch (payload.event) {
          default:
            break;
          case 'rabby:chainChanged': {
            const chain =
              findChain({
                hex: payload.data?.hex,
                name: payload.data?.name,
                enum: payload.data?.enum,
              }) || DEFAULT_ETH_CHAIN;

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

  const removeConnectedSite = useCallback(
    async (origin: string) => {
      await walletController.removeConnectedSite(origin);
      await fetchConnectedSite(true);
    },
    [fetchConnectedSite]
  );

  const removeAllConnectedSites = useCallback(async () => {
    await walletController.removeAllRecentConnectedSites();
    await fetchConnectedSite(true);
  }, [fetchConnectedSite]);

  return {
    currentConnectedSite,
    connectedSiteMap,
    fetchConnectedSite,
    removeConnectedSite,
    removeAllConnectedSites,
  };
}

export const useCurrentConnectedSite = ({
  origin,
  tab,
}: Pick<IDappWithTabInfo, 'origin' | 'tab'>) => {
  const { connectedSiteMap } = useConnectedSite();
  const [currentOrigin, setCurrentOrigin] = useState(origin);

  useEffect(() => {
    if (tab?.url) {
      setCurrentOrigin(canoicalizeDappUrl(tab.url).origin);
      return;
    }
    getLastOpenOriginByOrigin(origin).then((lastOpenOrigin) => {
      setCurrentOrigin(lastOpenOrigin?.toLowerCase());
    });
  }, [origin, tab?.url]);

  const httpOrigin = useMemo(
    () => formatDappHttpOrigin(currentOrigin),
    [currentOrigin]
  );

  return connectedSiteMap?.[httpOrigin] || null;
};

export const useListenSyncChain = () => {
  useEffectOnce(() => {
    return window.rabbyDesktop.ipcRenderer.on(
      '__internal_push:rabbyx:session-broadcast-forward-to-desktop',
      (payload) => {
        if (payload.event === 'syncChainList') {
          updateChainStore(payload.data || {});
        }
      }
    );
  });
};
