/* eslint-disable jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */
import { Dropdown, Menu } from 'antd';
import React, { useRef } from 'react';

import { useNavigateToDappRoute } from '@/renderer/utils/react-router';
import {
  RCIconDappsDelete,
  RCIconDappsEdit,
  RCIconPin,
  RCIconPinFill,
} from '../../../../../../assets/icons/internal-homepage';

import { DappFavicon } from '../../../../components/DappFavicon';
// import './index.less';

type IOnOpDapp = (op: 'rename' | 'delete', dapp: IDapp) => void;

export const DAppBlock = ({
  dapp,
  onAdd,
  onOpDapp,
}: React.PropsWithoutRef<{
  dapp?: IDapp;
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
            {
              key: 'dapp-pin',
              className: 'dapp-dropdown-item',
              label: <span className="text">Pin</span>,
              icon: <RCIconPin />,
              // todo
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
              Math.random() > 0.5 ? 'icon-pin.svg' : 'icon-pin-fill.svg'
            })`,
          }}
          onClickCapture={(evt) => {
            evt.stopPropagation();
          }}
        />
      </div>
    </Dropdown>
  );
};
