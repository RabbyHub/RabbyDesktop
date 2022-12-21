/* eslint-disable jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */
import { message } from 'antd';
import { useCallback, useMemo, useState } from 'react';

import ModalAddDapp from '../../components/ModalAddDapp';
import ModalDeleteDapp from '../../components/ModalDeleteDapp';
import ModalRenameDapp from '../../components/ModalRenameDapp';
import { useDapps } from '../../hooks/useDappsMngr';

import { useAppVersion } from '../../hooks/useMainBridge';
import { DAppBlock } from './components/DAppBlock';
import { Footer } from './components/Footer';

import { ReleaseNote } from './components/ReleaseNote';
import './index.less';

import style from './index.module.less';

type IOnOpDapp = (
  op: 'rename' | 'delete' | 'pin' | 'unpin',
  dapp: IDapp
) => void;

export default function DApps() {
  const appVersion = useAppVersion();

  const { dapps, pinnedList, pinDapp, unpinDapp } = useDapps();

  // const list = useMemo(() => {
  //   return dapps.map((item) => {
  //     return {
  //       ...item,
  //       isPinned: pinnedList.includes(item.origin),
  //     };
  //   });
  // }, [dapps, pinnedList]);

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
    <div className={style.page}>
      <div className={style.container}>
        <header className={style.header}>
          <h2 className={style.title}>My Dapps</h2>
          <div className={style.desc}>
            <img
              className={style.icon}
              src="rabby-internal://assets/icons/security-check/icon-shield-gray.svg"
            />
            Dapp Security Engine, provided by Rabby Wallet Desktop, offers
            better security for your Dapp use.
          </div>
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

        {/* <Footer appVersion={appVersion} /> */}
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
