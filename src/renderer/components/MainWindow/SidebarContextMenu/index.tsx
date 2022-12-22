import {
  RCIconPin,
  RCIconUnpinFill,
  RCIconClose,
} from '@/../assets/icons/internal-homepage';
import { useContextMenuPageInfo } from '@/renderer/hooks/useContextMenuPage';
import { useDapp } from '@/renderer/hooks/useDappsMngr';
import { hideContextMenuPopup } from '@/renderer/ipcRequest/contextmenu-popup';
import { toggleDappPinned } from '@/renderer/ipcRequest/dapps';
import {
  closeTabFromInternalPage,
  openDappFromInternalPage,
} from '@/renderer/ipcRequest/mainwin';
import { Menu } from 'antd';

import styles from './index.module.less';

export const SidebarContextMenu = () => {
  const pageInfo = useContextMenuPageInfo('sidebar-dapp');

  const origin = pageInfo?.dappTabInfo?.origin || '';
  const dappInfo = useDapp(origin);

  if (!origin) return null;
  if (pageInfo?.type !== 'sidebar-dapp') return null;

  return (
    <div>
      <Menu
        onClick={({ key }) => {
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
            case 'dapp-open':
              if (origin) {
                openDappFromInternalPage(origin);
              }
              break;
            default:
              break;
          }
          hideContextMenuPopup('sidebar-dapp');
        }}
        items={[
          dappInfo?.isPinned
            ? {
                key: 'dapp-unpin',
                className: styles['dapp-dropdown-item'],
                label: <span className="text">Unpin</span>,
                icon: (
                  <RCIconUnpinFill
                    className={styles['dapp-dropdown-item-icon']}
                  />
                ),
              }
            : {
                key: 'dapp-pin',
                className: styles['dapp-dropdown-item'],
                label: <span className="text">Pin</span>,
                icon: (
                  <RCIconPin className={styles['dapp-dropdown-item-icon']} />
                ),
              },
          !pageInfo?.dappTabInfo?.id
            ? {
                key: 'dapp-open',
                className: styles['dapp-dropdown-item'],
                label: <span className="text">Open</span>,
                icon: (
                  <RCIconClose
                    style={{ visibility: 'hidden' }}
                    className={styles['dapp-dropdown-item-icon']}
                  />
                ),
              }
            : {
                key: 'dapp-close',
                className: styles['dapp-dropdown-item'],
                label: <span className="text">Close</span>,
                icon: (
                  <RCIconClose className={styles['dapp-dropdown-item-icon']} />
                ),
              },
        ]}
      />
    </div>
  );
};
