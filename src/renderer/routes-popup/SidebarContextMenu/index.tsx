import { useDapp } from '@/renderer/hooks/useDappsMngr';
import {
  usePopupWinInfo,
  useZPopupLayerOnMain,
} from '@/renderer/hooks/usePopupWinOnMainwin';
import {
  getLastOpenOriginByOrigin,
  toggleDappPinned,
} from '@/renderer/ipcRequest/dapps';
import {
  closeAllTabs,
  closeTabFromInternalPage,
} from '@/renderer/ipcRequest/mainwin';
import { hideMainwinPopup } from '@/renderer/ipcRequest/mainwin-popup';
import { Menu } from 'antd';
import classNames from 'classnames';
import { MenuClickEventHandler } from 'rc-menu/lib/interface';

import { useConnectedSite } from '@/renderer/hooks/useRabbyx';
import { useMemo } from 'react';
import { toastTopMessage } from '@/renderer/ipcRequest/mainwin-popupview';
import { forwardMessageTo } from '@/renderer/hooks/useViewsMessage';
import { canoicalizeDappUrl } from '@/isomorphic/url';
import { checkoutDappURL, isOpenedAsHttpDappType } from '@/isomorphic/dapp';
import styles from './index.module.less';

const toast = (message: string) => {
  toastTopMessage({
    data: {
      type: 'success',
      content: message,
    },
  });
};

export const SidebarContextMenu = () => {
  const { pageInfo } = usePopupWinInfo('sidebar-dapp-contextmenu');

  const dappID = pageInfo?.dappTabInfo.dappID;
  const dappOrigin = useMemo(() => {
    if (!pageInfo?.dappTabInfo.dappType)
      return pageInfo?.dappTabInfo.dappOrigin;

    return checkoutDappURL(pageInfo?.dappTabInfo.dappID).dappHttpID;
  }, [pageInfo?.dappTabInfo]);
  const dappInfo = useDapp(dappID);
  const zActions = useZPopupLayerOnMain();
  const { removeConnectedSite, removeAllConnectedSites } = useConnectedSite();

  const disconnect = async (_origin: string, url?: string) => {
    let current = url ? canoicalizeDappUrl(url)?.origin : '';
    if (!current) {
      current = await getLastOpenOriginByOrigin(_origin);
    }
    removeConnectedSite(current);
    forwardMessageTo('*', 'refreshConnectedSiteMap', {});
    toast('Disconnected');
  };

  const items = useMemo(() => {
    if (!dappID) {
      return [];
    }
    return [
      dappInfo?.isPinned
        ? {
            key: 'dapp-unpin',
            className: styles['dapp-dropdown-item'],
            label: <span className="text">Unpin</span>,
            icon: (
              <img
                className={styles['dapp-dropdown-item-icon']}
                src="rabby-internal://assets/icons/sidebar-context-menu/icon-unpin.svg"
              />
            ),
          }
        : {
            key: 'dapp-pin',
            className: styles['dapp-dropdown-item'],
            label: <span className="text">Pin</span>,
            icon: (
              <img
                className={styles['dapp-dropdown-item-icon']}
                src="rabby-internal://assets/icons/sidebar-context-menu/icon-pin.svg"
              />
            ),
          },
      {
        key: 'dapp-rename',
        className: styles['dapp-dropdown-item'],
        label: <span className="text">Rename</span>,
        icon: (
          <img
            className={styles['dapp-dropdown-item-icon']}
            src="rabby-internal://assets/icons/sidebar-context-menu/icon-edit.svg"
          />
        ),
      },
      {
        key: 'dapp-disconnect',
        className: styles['dapp-dropdown-item'],
        label: <span className="text">Disconnect</span>,
        icon: (
          <img
            className={styles['dapp-dropdown-item-icon']}
            src="rabby-internal://assets/icons/sidebar-context-menu/icon-disconnect.svg"
          />
        ),
      },
      !pageInfo?.dappTabInfo?.id
        ? {
            key: 'dapp-delete',
            className: classNames(
              styles['dapp-dropdown-item'],
              styles['dapp-dropdown-item-danger']
            ),
            label: <span className="text">Delete</span>,
            icon: (
              <img
                className={styles['dapp-dropdown-item-icon']}
                src="rabby-internal://assets/icons/sidebar-context-menu/icon-trash.svg"
              />
            ),
          }
        : {
            key: 'dapp-close',
            className: styles['dapp-dropdown-item'],
            label: <span className="text">Close</span>,
            icon: (
              <img
                className={styles['dapp-dropdown-item-icon']}
                src="rabby-internal://assets/icons/sidebar-context-menu/icon-close.svg"
              />
            ),
          },

      {
        type: 'divider' as const,
      },
      {
        key: 'dapp-disconnect-all',
        className: styles['dapp-dropdown-item'],
        label: <span className="text">Disconnect All Dapps</span>,
        icon: (
          <img
            className={styles['dapp-dropdown-item-icon']}
            src="rabby-internal://assets/icons/sidebar-context-menu/icon-disconnect-all.svg"
          />
        ),
      },
      {
        key: 'dapp-close-all',
        className: styles['dapp-dropdown-item'],
        label: <span className="text">Close All Dapps</span>,
        icon: (
          <img
            className={styles['dapp-dropdown-item-icon']}
            src="rabby-internal://assets/icons/sidebar-context-menu/icon-close-all.svg"
          />
        ),
      },
    ];
  }, [dappInfo?.isPinned, dappID, pageInfo?.dappTabInfo?.id]);

  const handleMenuClick: MenuClickEventHandler = ({ key }) => {
    switch (key) {
      case 'dapp-pin':
        toggleDappPinned(dappID!, true);
        break;
      case 'dapp-unpin':
        toggleDappPinned(dappID!, false);
        break;
      case 'dapp-close': {
        const tabId = pageInfo?.dappTabInfo?.id;
        if (tabId) {
          closeTabFromInternalPage(tabId);
          toast('Closed');
        }
        break;
      }
      case 'dapp-rename':
        if (dappInfo) {
          zActions.showZSubview('rename-dapp-modal', {
            dapp: dappInfo as IDapp,
          });
        }
        break;
      case 'dapp-delete':
        if (dappInfo) {
          zActions.showZSubview('delete-dapp-modal', {
            dapp: dappInfo as IDapp,
          });
        }
        break;
      case 'dapp-disconnect': {
        if (dappOrigin) disconnect(dappOrigin, pageInfo?.dappTabInfo?.url);
        break;
      }
      case 'dapp-disconnect-all':
        removeAllConnectedSites();
        forwardMessageTo('*', 'refreshConnectedSiteMap', {});

        toast('All Dapps have been disconnected');
        break;
      case 'dapp-close-all':
        closeAllTabs();
        toast('All Dapps have been closed');
        break;
      default:
        break;
    }
    hideMainwinPopup('sidebar-dapp-contextmenu');
  };

  if (!dappID || !dappOrigin) return null;
  if (pageInfo?.type !== 'sidebar-dapp-contextmenu') return null;

  return (
    <div className={styles.winWrapper}>
      <Menu
        className={styles.dappDropdownMenu}
        onClick={handleMenuClick}
        items={items}
      />
    </div>
  );
};
