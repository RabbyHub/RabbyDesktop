import {
  RCIconDappsEdit,
  RCIconPin,
} from '@/../assets/icons/internal-homepage';
import { useDapps } from '@/renderer/hooks/useDappsMngr';
import { hideContextMenuPopup } from '@/renderer/ipcRequest/contextmenu-popup';
import { closeTabFromInternalPage } from '@/renderer/ipcRequest/mainwin';
import { Menu } from 'antd';
import { useMemo } from 'react';

interface SidebarContextMenuProps {
  data?: IContextMenuPageInfo | null;
}
export const SidebarContextMenu = ({ data }: SidebarContextMenuProps) => {
  const { pinnedList, pinDapp, unpinDapp } = useDapps();
  const origin = useMemo(() => {
    return data?.dappTabInfo?.url ? new URL(data?.dappTabInfo?.url).origin : '';
  }, [data?.dappTabInfo?.url]);

  const isPinned = useMemo(() => {
    return (pinnedList || []).includes(origin);
  }, [pinnedList, origin]);

  return (
    <div>
      <Menu
        onClick={({ key }) => {
          if (data?.dappTabInfo?.id) {
            switch (key) {
              case 'dapp-pin':
                pinDapp(origin);
                break;
              case 'dapp-unpin':
                unpinDapp(origin);
                break;
              case 'dapp-close':
                closeTabFromInternalPage(data?.dappTabInfo?.id);
                break;
              default:
                break;
            }
            hideContextMenuPopup();
          }
        }}
        items={[
          isPinned
            ? {
                key: 'dapp-unpin',
                className: 'dapp-dropdown-item',
                label: <span className="text">Unpin</span>,
                icon: <RCIconPin />,
              }
            : {
                key: 'dapp-pin',
                className: 'dapp-dropdown-item',
                label: <span className="text">Pin</span>,
                icon: <RCIconPin />,
              },
          {
            key: 'dapp-close',
            className: 'dapp-dropdown-item',
            label: <span className="text">Close</span>,
            icon: <RCIconDappsEdit />,
          },
        ]}
      />
    </div>
  );
};
