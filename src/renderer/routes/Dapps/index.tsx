/* eslint-disable jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */
import React, { useState } from 'react';
import { Menu, Dropdown, message } from 'antd';

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

function DAppBlock({
  dapp,
  onAdd,
  onOpDapp,
}: React.PropsWithoutRef<{
  dapp?: IDapp;
  onAdd?: () => void;
  onOpDapp?: (op: 'rename' | 'delete', dapp: IDapp) => void;
}>) {
  if (onAdd) {
    return (
      <div className="dapp-block-wrapper J_add">
        <div
          className="dapp-block"
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
      </div>
    );
  }

  if (!dapp) return null;

  return (
    <div className="dapp-block-wrapper">
      <div className="dapp-block">
        <a className="anchor" href={dapp.origin} target="_blank" rel="noreferrer">
          {/* TODO: robust about load image */}
          <img className="dapp-favicon" src={dapp.faviconUrl} alt="add" />
          <div className="infos">
            <h4 className="dapp-alias">{dapp.alias}</h4>
            <span className="dapp-url">{dapp.origin}</span>
          </div>
        </a>
        <Dropdown
          overlayClassName="dapps-dropdown-operations"
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
              backgroundImage: `url(rabby-internal://assets/icons/internal-homepage/icon-dapps-menu.svg)`
            }}
            onClickCapture={(evt) => {
              evt.stopPropagation();
            }}
          />
        </Dropdown>
      </div>
    </div>
  );
}

export default function DApps() {
  const appVersion = useAppVersion();

  const { dapps } = useDapps();

  const [isAdding, setIsAdding] = useState(false);

  const [renamingDapp, setRenamingDapp] = useState<IDapp | null>(null);
  const [deletingDapp, setDeletingDapp] = useState<IDapp | null>(null);

  // useEffect(() => {
  //   // TODO: just for test
  //   setDeletingDapp(dapps[0] || null);
  // }, [ dapps[0] ]);

  return (
    <div id="homepage">
      {isAdding && (
        <ModalAddDapp
          open
          onCancel={() => setIsAdding(false)}
          onAddedDapp={() => {
            message.success('Added successfully');
            setIsAdding(false);
          }}
        />
      )}
      {renamingDapp && (
        <ModalRenameDapp
          open
          dapp={renamingDapp}
          onCancel={() => setRenamingDapp(null)}
          onRenamedDapp={() => setRenamingDapp(null)}
        />
      )}
      {deletingDapp && (
        <ModalDeleteDapp
          open
          dapp={deletingDapp}
          onCancel={() => setDeletingDapp(null)}
          onDeletedDapp={() => setDeletingDapp(null)}
        />
      )}
      <header>
        <h2 className="title">My Dapps</h2>
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
                  onOpDapp={(op) => {
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
                  }}
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

      <footer>
        <img
          className="logo"
          src="rabby-internal://assets/icons/internal-homepage/logo.svg"
          alt="logo"
        />
        <div className="version-text">Version: {appVersion}</div>
      </footer>
    </div>
  );
}
