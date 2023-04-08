/* eslint-disable jsx-a11y/anchor-is-valid */
/* eslint-disable jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */
import { Dropdown, Menu } from 'antd';
import React, { ReactNode, useMemo, useRef } from 'react';

import { hideMainwinPopup } from '@/renderer/ipcRequest/mainwin-popup';

import clsx from 'clsx';
import { getLastOpenOriginByOrigin } from '@/renderer/ipcRequest/dapps';

import { CHAINS } from '@/renderer/utils/constant';
import { CHAINS_ENUM } from '@debank/common/dist/chain-data';
import { DappFavicon } from '../../../../components/DappFavicon';

// todo: move to components
const DappIcon = ({
  origin,
  src,
  chain,
}: {
  origin: string;
  src?: string;
  chain?: CHAINS_ENUM;
}) => {
  const chainLogo = useMemo(() => {
    if (chain) {
      return CHAINS[chain]?.logo;
    }
    return null;
  }, [chain]);

  return (
    <div className="dapp-icon-with-chain">
      <DappFavicon origin={origin} src={src} className="dapp-favicon" />
      {chainLogo && <img src={chainLogo} alt="" className="chain-logo" />}
    </div>
  );
};

const Indicator = ({ dapp }: { dapp: IDappWithTabInfo }) => {
  if (!dapp.tab) {
    return null;
  }
  return <div className="dapp-indicator" />;
  // return dapp?.tab ? (
  //   dapp.tab.status === 'loading' ? (
  //     <img
  //       className="dapp-indicator loading"
  //       src="rabby-internal://assets/icons/dapps/dapp-loading.svg"
  //     />
  //   ) : (
  //     <div className="dapp-indicator" />
  //   )
  // ) : null;
};

type IOnOpDapp = (
  op: 'rename' | 'delete' | 'pin' | 'unpin',
  dapp: IDapp
) => void;

export const DAppBlock = ({
  dapp,
  onAdd,
  onOpen,
  onOpDapp,
}: React.PropsWithoutRef<{
  dapp?: IDappWithTabInfo;
  onAdd?: () => void;
  onOpDapp?: IOnOpDapp;
  onOpen?: (dappOrigin: string) => void;
}>) => {
  const ref = useRef<HTMLDivElement>(null);

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
                  icon: (
                    <img
                      className="dapp-dropdown-item-icon"
                      src="rabby-internal://assets/icons/sidebar-context-menu/icon-unpin.svg"
                    />
                  ),
                }
              : {
                  key: 'dapp-pin',
                  className: 'dapp-dropdown-item',
                  label: <span className="text">Pin</span>,
                  icon: (
                    <img
                      className="dapp-dropdown-item-icon"
                      src="rabby-internal://assets/icons/sidebar-context-menu/icon-pin.svg"
                    />
                  ),
                },
            {
              key: 'dapp-rename',
              className: 'dapp-dropdown-item',
              label: <span className="text">Rename</span>,
              icon: (
                <img
                  className="dapp-dropdown-item-icon"
                  src="rabby-internal://assets/icons/sidebar-context-menu/icon-edit.svg"
                />
              ),
            },
            {
              key: 'dapp-delete',
              className: 'dapp-dropdown-item dapp-dropdown-item-danger',
              label: <span className="text">Delete</span>,
              icon: (
                <img
                  className="dapp-dropdown-item-icon"
                  src="rabby-internal://assets/icons/sidebar-context-menu/icon-trash.svg"
                />
              ),
            },
          ]}
        />
      }
    >
      <div
        className="dapp-block"
        ref={ref}
        onContextMenu={() => {
          hideMainwinPopup('sidebar-dapp');
        }}
      >
        <div className={clsx('dapp-block-badge')}>
          <Indicator dapp={dapp} />
        </div>
        <div
          className="anchor"
          onClick={(e) => {
            e.preventDefault();
            if (onOpen) {
              getLastOpenOriginByOrigin(dapp.origin).then((lastOrigin) => {
                onOpen(lastOrigin);
              });
            }
          }}
        >
          <DappIcon
            origin={dapp.origin}
            src={dapp.faviconBase64 ? dapp.faviconBase64 : dapp.faviconUrl}
            // chain={chain}
          />
          <div className="infos pr-[16px]">
            <h4 className="dapp-alias">{dapp.alias}</h4>
            <div className="dapp-url">
              {dapp.origin?.replace(/^\w+:\/\//, '')}
            </div>
          </div>
        </div>

        <div
          className={clsx('menu-entry', dapp.isPinned && 'is-pinned')}
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
