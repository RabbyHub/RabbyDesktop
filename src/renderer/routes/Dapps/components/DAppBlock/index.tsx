/* eslint-disable jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */
import { Dropdown, Menu } from 'antd';
import React, { useRef } from 'react';

import { useNavigateToDappRoute } from '@/renderer/utils/react-router';
import {
  RCIconDappsDelete,
  RCIconDappsEdit,
  RCIconPin,
} from '../../../../../../assets/icons/internal-homepage';

import { DappFavicon } from '../../../../components/DappFavicon';
// import './index.less';

type IOnOpDapp = (
  op: 'rename' | 'delete' | 'pin' | 'unpin',
  dapp: IDapp
) => void;

export const DAppBlock = ({
  dapp,
  onAdd,
  onOpDapp,
}: React.PropsWithoutRef<{
  dapp?: IMergedDapp;
  onAdd?: () => void;
  onOpDapp?: IOnOpDapp;
}>) => {
  const ref = useRef<HTMLDivElement>(null);
  const navigateTo = useNavigateToDappRoute();

  if (onAdd) {
    return (
      <div
        className="dapp-block is-add"
        onClick={() => {
          onAdd();
        }}
      >
        <img
          className="dapp-favicon"
          src="rabby-internal://assets/icons/internal-homepage/icon-dapps-add.svg"
          alt="add"
        />
        <div className="text">Add a Dapp</div>
      </div>
    );
  }

  if (!dapp) return null;

  return (
    <Dropdown
      overlayClassName="dapps-dropdown-operations"
      getPopupContainer={() => ref.current || document.body}
      trigger={['contextMenu']}
      // open
      overlay={
        <Menu
          onClick={({ key }) => {
            switch (key) {
              case 'dapp-pin':
                onOpDapp?.('pin', dapp);
                break;
              case 'dapp-unpin':
                onOpDapp?.('unpin', dapp);
                break;
              case 'dapp-rename':
                onOpDapp?.('rename', dapp);
                break;
              case 'dapp-delete':
                onOpDapp?.('delete', dapp);
                break;
              default:
                break;
            }
          }}
          items={[
            dapp.isPinned
              ? {
                  key: 'dapp-unpin',
                  className: 'dapp-dropdown-item',
                  label: <span className="text">Unpin</span>,
                  // icon: <RCIconPinFill />,
                  icon: <RCIconPin />,
                }
              : {
                  key: 'dapp-pin',
                  className: 'dapp-dropdown-item',
                  label: <span className="text">Pin</span>,
                  icon: <RCIconPin />,
                },
            {
              key: 'dapp-rename',
              className: 'dapp-dropdown-item',
              label: <span className="text">Rename</span>,
              icon: <RCIconDappsEdit />,
            },
            {
              key: 'dapp-delete',
              className: 'dapp-dropdown-item J_delete',
              label: <span className="text">Delete</span>,
              icon: <RCIconDappsDelete />,
            },
          ]}
        />
      }
    >
      <div className="dapp-block" ref={ref}>
        <a
          className="anchor"
          href={dapp.origin}
          target="_blank"
          rel="noreferrer"
          onClick={() => {
            navigateTo(dapp?.origin);
          }}
        >
          <DappFavicon
            className="dapp-favicon"
            origin={dapp.origin}
            src={dapp.faviconBase64 ? dapp.faviconBase64 : dapp.faviconUrl}
          />
          <div className="infos">
            <h4 className="dapp-alias">{dapp.alias}</h4>
            <div className="dapp-url">{dapp.origin}</div>
          </div>
        </a>

        <div
          className="menu-entry"
          style={{
            // todo
            backgroundImage: `url(rabby-internal://assets/icons/internal-homepage/${
              dapp.isPinned ? 'icon-pin-fill.svg' : 'icon-pin.svg'
            })`,
          }}
          onClickCapture={(evt) => {
            evt.stopPropagation();
            onOpDapp?.(dapp.isPinned ? 'unpin' : 'pin', dapp);
          }}
        />
      </div>
    </Dropdown>
  );
};
