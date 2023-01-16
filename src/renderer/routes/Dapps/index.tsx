/* eslint-disable jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */
import { CurrentAccountAndNewAccount } from '@/renderer/components/CurrentAccount';
import { useWindowTabs } from '@/renderer/hooks-shell/useWindowTabs';
import { setDappsOrder } from '@/renderer/ipcRequest/dapps';
import { message } from 'antd';
import { useCallback, useState } from 'react';

import ModalAddDapp from '../../components/ModalAddDapp';
import ModalDeleteDapp from '../../components/ModalDeleteDapp';
import ModalRenameDapp from '../../components/ModalRenameDapp';
import { useDapps, useTabedDapps } from '../../hooks/useDappsMngr';

import { DAppBlock } from './components/DAppBlock';

import { ReleaseNote } from './components/ReleaseNote';
import { SortableList } from './components/SortableList';
import './index.less';

import style from './index.module.less';

type IOnOpDapp = (
  op: 'rename' | 'delete' | 'pin' | 'unpin',
  dapp: IDapp
) => void;

export default function DApps() {
  const { dapps, pinDapp, unpinDapp, pinnedDapps, unpinnedDapps, openDapp } =
    useTabedDapps();
  const { tabMap } = useWindowTabs();

  const [isAdding, setIsAdding] = useState(false);

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

  const [_data, setData] = useState(dapps);
  console.log(dapps);

  return (
    <div className={style.page}>
      <img
        className={style.addDapp}
        src="rabby-internal://assets/icons/internal-homepage/icon-dapps-add.svg"
        alt=""
        onClick={() => {
          setIsAdding(true);
        }}
      />
      <div className={style.container}>
        <header className={style.header}>
          <div className={style.desc}>
            <img
              className={style.icon}
              src="rabby-internal://assets/icons/security-check/icon-shield-gray.svg"
            />
            Dapp Security Engine, provided by Rabby Wallet Desktop, offers
            better security for your Dapp use.
          </div>
        </header>
        <main className={style.main}>
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
        </main>

        <ModalAddDapp
          destroyOnClose
          open={isAdding}
          onCancel={() => setIsAdding(false)}
          onAddedDapp={() => {
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
