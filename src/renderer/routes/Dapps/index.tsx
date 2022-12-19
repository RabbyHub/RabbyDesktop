/* eslint-disable jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */
import React, { useCallback, useRef, useState } from 'react';
import { Menu, Dropdown, message } from 'antd';

import { useClickToPopupDebugMenu } from '@/renderer/hooks/useRegChannelTools';
import { useNavigateToDappRoute } from '@/renderer/utils/react-router';
import {
  RCIconDappsEdit,
  RCIconDappsDelete,
} from '../../../../assets/icons/internal-homepage';

import { useDapps } from '../../hooks/useDappsMngr';
import ModalAddDapp from '../../components/ModalAddDapp';
import ModalRenameDapp from '../../components/ModalRenameDapp';
import ModalDeleteDapp from '../../components/ModalDeleteDapp';

import { useAppVersion } from '../../hooks/useMainBridge';

import './index.less';
import { AutoUpdate } from './components/AutoUpdate';
import { DappFavicon } from '../../components/DappFavicon';
import { ReleaseNote } from './components/ReleaseNote';

type IOnOpDapp = (op: 'rename' | 'delete', dapp: IDapp) => void;

function DAppBlock({
  dapp,
  onAdd,
  onOpDapp,
}: React.PropsWithoutRef<{
  dapp?: IDapp;
  onAdd?: () => void;
  onOpDapp?: IOnOpDapp;
}>) {
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
      <Dropdown
        overlayClassName="dapps-dropdown-operations"
        getPopupContainer={() => ref.current || document.body}
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
        <div
          className="menu-entry"
          style={{
            backgroundImage: `url(rabby-internal://assets/icons/internal-homepage/icon-dapps-menu.svg)`,
          }}
          onClickCapture={(evt) => {
            evt.stopPropagation();
          }}
        />
      </Dropdown>
    </div>
  );
}

function Footer({ appVersion = '' }) {
  const { onClick5TimesFooterVersion, closeDebugMenu, showDebugMenu } =
    useClickToPopupDebugMenu();

  return (
    <footer>
      <div className="container">
        <img
          className="logo"
          src="rabby-internal://assets/icons/internal-homepage/logo.svg"
          alt="logo"
        />
        <Dropdown
          open={showDebugMenu}
          onOpenChange={(nextOpen) => {
            if (!nextOpen) {
              closeDebugMenu();
            }
          }}
          overlay={
            <Menu
              items={[
                {
                  key: 'add-debug-insecure-dapps',
                  label: 'Add Debug Insecure Dapps',
                  onClick: () => {
                    window.rabbyDesktop.ipcRenderer.sendMessage(
                      '__internal_rpc:debug-tools:operate-debug-insecure-dapps',
                      'add'
                    );
                  },
                },
                {
                  key: 'trim-debug-insecure-dapps',
                  label: 'Trim Debug Insecure Dapps',
                  onClick: () => {
                    window.rabbyDesktop.ipcRenderer.sendMessage(
                      '__internal_rpc:debug-tools:operate-debug-insecure-dapps',
                      'trim'
                    );
                  },
                },
              ]}
            />
          }
        >
          <div className="version-text" onClick={onClick5TimesFooterVersion}>
            Version: {appVersion || '-'}
          </div>
        </Dropdown>
      </div>
    </footer>
  );
}

export default function DApps() {
  const appVersion = useAppVersion();

  const { dapps } = useDapps();

  const [isAdding, setIsAdding] = useState(false);

  const [renamingDapp, setRenamingDapp] = useState<IDapp | null>(null);
  const [deletingDapp, setDeletingDapp] = useState<IDapp | null>(null);

  const onClickDapp: IOnOpDapp = useCallback((op, dapp: IDapp) => {
    switch (op) {
      case 'delete': {
        setDeletingDapp(dapp);
        break;
      }
      case 'rename': {
        setRenamingDapp(dapp);
        break;
      }
      default:
        break;
    }
  }, []);

  // useEffect(() => {
  //   // TODO: just for test
  //   setDeletingDapp(dapps[0] || null);
  // }, [ dapps[0] ]);

  // useLayoutEffect(() => {
  //   const listener: GetIpcRequestListenerFirstParams<typeof document.body.addEventListener, 'contextmenu'> = evt => {

  //   };
  //   document.body.addEventListener('contextmenu', listener);

  //   return () => {
  //     document.body.removeEventListener('contextmenu', listener);
  //   }
  // }, []);

  return (
    <div id="homepage">
      <div
        className="page-content"
        style={{
          background:
            "url('rabby-internal://assets/icons/common/logo-op-5.svg') no-repeat bottom 80px right",
        }}
      >
        <AutoUpdate />
        <header>
          <div className="title">
            <h2 className="title-text">My Dapps</h2>
            <span className="security-description">
              <img
                className="shield-icon"
                src="rabby-internal://assets/icons/security-check/icon-shield-in-home.svg"
              />
              Being protected by Dapp Security Engine
            </span>
          </div>
          <p className="subtitle">
            Dapp Security Engine, provided by Rabby Wallet Desktop, offers
            better security for your Dapp use.
          </p>
        </header>
        <main>
          <div className="dapps">
            <div className="dapp-matrix">
              {dapps.map((dapp, idx) => {
                return (
                  <DAppBlock
                    /* eslint-disable-next-line react/no-array-index-key */
                    key={`${dapp.origin}-${dapp.alias}-${idx}`}
                    dapp={dapp}
                    onOpDapp={onClickDapp}
                  />
                );
              })}
              <DAppBlock
                key="J_add"
                onAdd={() => {
                  setIsAdding(true);
                }}
              />
            </div>
          </div>
        </main>

        <Footer appVersion={appVersion} />
        <ModalAddDapp
          destroyOnClose
          open={isAdding}
          onCancel={() => setIsAdding(false)}
          onAddedDapp={() => {
            message.success('Added successfully');
            setIsAdding(false);
          }}
        />
        <ModalRenameDapp
          destroyOnClose
          open={!!renamingDapp}
          dapp={renamingDapp}
          onCancel={() => setRenamingDapp(null)}
          onRenamedDapp={() => setRenamingDapp(null)}
        />
        <ModalDeleteDapp
          destroyOnClose
          open={!!deletingDapp}
          dapp={deletingDapp}
          onCancel={() => setDeletingDapp(null)}
          onDeletedDapp={() => setDeletingDapp(null)}
        />
        <ReleaseNote />
      </div>
    </div>
  );
}
