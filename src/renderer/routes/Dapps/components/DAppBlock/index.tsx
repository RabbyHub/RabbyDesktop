/* eslint-disable jsx-a11y/anchor-is-valid */
/* eslint-disable jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */
import { Dropdown, Menu } from 'antd';
import React, { ReactNode, useRef } from 'react';

import { formatDappURLToShow } from '@/isomorphic/dapp';
import { getLastOpenOriginByOrigin } from '@/renderer/ipcRequest/dapps';
import { hideMainwinPopup } from '@/renderer/ipcRequest/mainwin-popup';
import clsx from 'clsx';

import { useCurrentConnectedSite } from '@/renderer/hooks/useRabbyx';
import { useDapps } from '@/renderer/hooks/useDappsMngr';
import { TipsWrapper } from '@/renderer/components/TipWrapper';
import { DappFavicon } from '../../../../components/DappFavicon';

import styles from '../../index.module.less';

const Indicator = ({ dapp }: { dapp: IDappWithTabInfo }) => {
  if (!dapp.tab) {
    return null;
  }
  return <div className="dapp-indicator" />;
};

const DappBadge = ({
  indicator,
  type,
}: {
  indicator: ReactNode;
  type: string;
}) => {
  if (type === 'ipfs') {
    return (
      <div className="tag tag-ipfs">
        {indicator}
        IPFS
      </div>
    );
  }
  if (type === 'ens') {
    return (
      <div className="tag tag-ens">
        {indicator}
        ENS
      </div>
    );
  }
  if (type === 'localfs') {
    return (
      <div className="tag tag-local">
        {indicator}
        Local
      </div>
    );
  }
  return <>{indicator}</>;
};

type IOnOpDapp = (
  op: 'rename' | 'delete' | 'pin' | 'unpin' | 'open',
  dapp: IDapp
) => void;

export const DAppBlock = ({
  dapp,
  onOpen,
  onOpDapp,
}: React.PropsWithoutRef<{
  dapp?: IDappWithTabInfo;
  onOpDapp?: IOnOpDapp;
  onOpen?: (dappOrigin: INextDapp['origin']) => void;
}>) => {
  const ref = useRef<HTMLDivElement>(null);

  const connectedSite = useCurrentConnectedSite({
    origin: dapp?.origin || '',
    tab: dapp?.tab,
  });

  const { dapps } = useDapps();

  if (!dapp) return null;

  return (
    <Dropdown
      overlayClassName="dapps-dropdown-operations"
      getPopupContainer={() =>
        document.querySelector(`.${styles.main}`) || document.body
      }
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
              case 'dapp-home':
                onOpDapp?.('open', dapp);
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
              key: 'dapp-home',
              className: 'dapp-dropdown-item',
              label: <span className="text">Open HomePage</span>,
              icon: (
                <img
                  className="dapp-dropdown-item-icon"
                  src="rabby-internal://assets/icons/sidebar-context-menu/icon-home.svg"
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
          hideMainwinPopup('sidebar-dapp-contextmenu');
        }}
      >
        <div className={clsx('dapp-block-badge')}>
          <DappBadge type={dapp.type} indicator={<Indicator dapp={dapp} />} />
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
          <DappFavicon
            rootClassName="dapp-icon-with-chain"
            origin={dapp.origin}
            src={dapp.faviconBase64 ? dapp.faviconBase64 : dapp.faviconUrl}
            chain={connectedSite?.chain}
          />
          <div className="infos pr-[16px]">
            <h4 className="dapp-alias">{dapp.alias}</h4>
            <div className="dapp-url">
              {formatDappURLToShow(dapp.id || dapp.origin, { dapps }).replace(
                /^\w+:\/\/\/?/,
                ''
              )}
            </div>
          </div>
        </div>
        <TipsWrapper hoverTips={dapp.isPinned ? 'Unpin Dapp' : 'Pin Dapp'}>
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
        </TipsWrapper>
      </div>
    </Dropdown>
  );
};
