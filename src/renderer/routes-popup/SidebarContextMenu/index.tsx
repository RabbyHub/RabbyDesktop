import { useDapp } from '@/renderer/hooks/useDappsMngr';
import {
  usePopupWinInfo,
  useZPopupLayerOnMain,
} from '@/renderer/hooks/usePopupWinOnMainwin';
import { toggleDappPinned } from '@/renderer/ipcRequest/dapps';
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
import styles from './index.module.less';

export const SidebarContextMenu = () => {
  const { pageInfo } = usePopupWinInfo('sidebar-dapp');

  const origin = pageInfo?.dappTabInfo?.origin || '';
  const dappInfo = useDapp(origin);
  const zActions = useZPopupLayerOnMain();
  const { connectedSiteMap, removeConnectedSite, removeAllConnectedSites } =
    useConnectedSite();

  const items = useMemo(() => {
    if (!origin) {
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
  }, [dappInfo?.isPinned, origin, pageInfo?.dappTabInfo?.id]);

  const handleMenuClick: MenuClickEventHandler = ({ key }) => {
    switch (key) {
      case 'dapp-pin':
        toggleDappPinned(origin, true);
        break;
      case 'dapp-unpin':
        toggleDappPinned(origin, false);
        break;
      case 'dapp-close': {
        const tabId = pageInfo?.dappTabInfo?.id;
        if (tabId) {
          closeTabFromInternalPage(tabId);
          zActions.showZSubview('toast-zpopup-message', {
            type: 'success',
            content: 'Closed',
          });
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
      case 'dapp-disconnect':
        if (dappInfo && connectedSiteMap[origin]) {
          removeConnectedSite(origin);
        }
        zActions.showZSubview('toast-zpopup-message', {
          type: 'success',
          content: 'Disconnected',
        });
        break;
      case 'dapp-disconnect-all':
        removeAllConnectedSites();
        zActions.showZSubview('toast-zpopup-message', {
          type: 'success',
          content: 'Disconnected',
        });
        break;
      case 'dapp-close-all':
        closeAllTabs();
        zActions.showZSubview('toast-zpopup-message', {
          type: 'success',
          content: 'Closed',
        });
        break;
      default:
        break;
    }
    hideMainwinPopup('sidebar-dapp');
  };

  if (!origin) return null;
  if (pageInfo?.type !== 'sidebar-dapp') return null;

  return (
    <div>
      <Menu
        className={styles.dappDropdownMenu}
        onClick={handleMenuClick}
        items={items}
      />
    </div>
  );
};
