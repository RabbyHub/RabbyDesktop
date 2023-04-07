/* eslint-disable jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */
import { setDappsOrder } from '@/renderer/ipcRequest/dapps';
import { showMainwinPopupview } from '@/renderer/ipcRequest/mainwin-popupview';
import { useOpenDapp } from '@/renderer/utils/react-router';
import { useCallback, useState } from 'react';
import { closeAllTabs } from '@/renderer/ipcRequest/mainwin';
import { ModalConfirm } from '@/renderer/components/Modal/Confirm';
import { toastMessage } from '@/renderer/components/TransparentToast';
import { useConnectedSite } from '@/renderer/hooks/useRabbyx';
import { Empty } from './components/Empty';

import ModalDeleteDapp from '../../components/ModalDeleteDapp';
import ModalRenameDapp from '../../components/ModalRenameDapp';
import { useTabedDapps } from '../../hooks/useDappsMngr';

import { DAppBlock } from './components/DAppBlock';

import { SortableList } from './components/SortableList';
import './index.less';

import { NFTPanel } from './components/NFTPanel/NFTPanel';
import style from './index.module.less';

type IOnOpDapp = (
  op: 'rename' | 'delete' | 'pin' | 'unpin',
  dapp: IDapp
) => void;

export default function DApps() {
  const { dapps, pinDapp, unpinDapp, pinnedDapps, unpinnedDapps } =
    useTabedDapps();

  const openDapp = useOpenDapp();

  const [renamingDapp, setRenamingDapp] = useState<IDapp | null>(null);
  const [deletingDapp, setDeletingDapp] = useState<IDapp | null>(null);

  const onClickDapp: IOnOpDapp = useCallback(
    (op, dapp: IDapp) => {
      switch (op) {
        case 'unpin': {
          unpinDapp(dapp.origin);
          break;
        }
        case 'pin': {
          pinDapp(dapp.origin);
          break;
        }
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
    },
    [pinDapp, unpinDapp]
  );

  const { removeAllConnectedSites } = useConnectedSite();

  const handleDisconnectAll = () => {
    ModalConfirm({
      title: 'Disconnect my wallets with all Dapps',
      content: <div className="h-[48px]" />,
      closable: true,
      className: style.modalConfirm,
      onOk: async () => {
        await removeAllConnectedSites();
        toastMessage({
          content: 'All Dapps have been disconnected.',
          type: 'success',
        });
      },
    });
  };

  const handleCloseAll = () => {
    ModalConfirm({
      title: 'Close all open Dapps',
      content: <div className="h-[48px]" />,
      closable: true,
      className: style.modalConfirm,
      onOk: async () => {
        await closeAllTabs();
        toastMessage({
          content: 'All Dapps have been closed.',
          type: 'success',
        });
      },
    });
  };

  return (
    <div className={style.page}>
      <img
        className={style.addDapp}
        src="rabby-internal://assets/icons/internal-homepage/icon-dapps-add.svg"
        alt=""
        onClick={() => {
          showMainwinPopupview({ type: 'dapps-management' });
        }}
      />
      <div className={style.container}>
        <header className={style.header}>
          <div className={style.desc}>
            <img
              className={style.icon}
              src="rabby-internal://assets/icons/security-check/icon-shield-gray.svg"
            />
            Dapp Security Engine, provided by Rabby Desktop, offers better
            security for your Dapp use.
          </div>
          <div className={style.actionList}>
            {/* <div className={style.action} onClick={handleDisconnectAll}>
              <img
                src="rabby-internal://assets/icons/dapps/icon-disconnect.svg"
                alt=""
              />
              Disconnect All Dapps
            </div> */}
            <div className={style.action} onClick={handleCloseAll}>
              <img
                src="rabby-internal://assets/icons/dapps/icon-close.svg"
                alt=""
              />
              Close All Dapps
            </div>
          </div>
        </header>
        <main className={style.main}>
          {dapps?.length ? (
            <div className="dapps">
              <div className="dapp-matrix">
                <SortableList
                  data={pinnedDapps}
                  onChange={(v) => {
                    setDappsOrder({
                      pinnedList: v.map((item) => item.origin),
                    });
                  }}
                  renderItem={(dapp) => {
                    return (
                      <DAppBlock
                        onOpen={openDapp}
                        key={dapp.origin}
                        dapp={dapp}
                        onOpDapp={onClickDapp}
                      />
                    );
                  }}
                />
                <SortableList
                  data={unpinnedDapps}
                  onChange={(v) => {
                    setDappsOrder({
                      unpinnedList: v.map((item) => item.origin),
                    });
                  }}
                  renderItem={(dapp) => {
                    return (
                      <DAppBlock
                        onOpen={openDapp}
                        key={dapp.origin}
                        dapp={dapp}
                        onOpDapp={onClickDapp}
                      />
                    );
                  }}
                />
              </div>
            </div>
          ) : (
            <Empty />
          )}
        </main>

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
        <NFTPanel />
      </div>
    </div>
  );
}
