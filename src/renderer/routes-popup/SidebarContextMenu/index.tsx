import {
  RCIconClose,
  RCIconPin,
  RCIconUnpinFill,
} from '@/../assets/icons/internal-homepage';
import { useDapp } from '@/renderer/hooks/useDappsMngr';
import {
  usePopupWinInfo,
  useZPopupLayerOnMain,
} from '@/renderer/hooks/usePopupWinOnMainwin';
import { toggleDappPinned } from '@/renderer/ipcRequest/dapps';
import {
  closeTabFromInternalPage,
  openDappFromInternalPage,
} from '@/renderer/ipcRequest/mainwin';
import { hideMainwinPopup } from '@/renderer/ipcRequest/mainwin-popup';
import { Menu } from 'antd';
import classNames from 'classnames';
import { MenuClickEventHandler } from 'rc-menu/lib/interface';

import { useMemo } from 'react';
import styles from './index.module.less';

export const SidebarContextMenu = () => {
  const { pageInfo } = usePopupWinInfo('sidebar-dapp');

  const origin = pageInfo?.dappTabInfo?.origin || '';
  const dappInfo = useDapp(origin);
  const zActions = useZPopupLayerOnMain();

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
                src="rabby-internal://assets/icons/sidebar-context-menu/icon-pinned.svg"
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
        if (tabId) closeTabFromInternalPage(tabId);
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
