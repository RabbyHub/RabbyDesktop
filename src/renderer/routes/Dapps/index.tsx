/* eslint-disable jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */
import { setDappsOrder, toggleDappPinned } from '@/renderer/ipcRequest/dapps';
import { showMainwinPopupview } from '@/renderer/ipcRequest/mainwin-popupview';
import { useOpenDapp } from '@/renderer/utils/react-router';
import { useCallback, useMemo, useState } from 'react';
import { closeAllTabs } from '@/renderer/ipcRequest/mainwin';
import { ModalConfirm } from '@/renderer/components/Modal/Confirm';
import { toastMessage } from '@/renderer/components/TransparentToast';
import { useConnectedSite } from '@/renderer/hooks/useRabbyx';
import { Dropdown, Menu } from 'antd';
import RabbyInput from '@/renderer/components/AntdOverwrite/Input';
import { useDebounce } from 'ahooks';
import { Empty } from './components/Empty';

import ModalDeleteDapp from '../../components/ModalDeleteDapp';
import ModalRenameDapp from '../../components/ModalRenameDapp';
import { useTabedDapps } from '../../hooks/useDappsMngr';

import { DAppBlock } from './components/DAppBlock';

import { SortableList } from './components/SortableList';
import './index.less';

import { NFTPanel } from './components/NFTPanel/NFTPanel';
import style from './index.module.less';
import { NoResults } from './components/NoResults';

type IOnOpDapp = (
  op: 'rename' | 'delete' | 'pin' | 'unpin' | 'open',
  dapp: IDapp
) => void;

const findDapps = (dapps: IDappWithTabInfo[], input: string) => {
  input = input?.trim();
  if (!input) {
    return dapps;
  }
  return dapps.filter((dapp) => {
    return (
      dapp.alias?.toLowerCase().includes(input.toLowerCase()) ||
      dapp.origin?.toLowerCase().includes(input.toLowerCase())
    );
  });
};

export default function DApps() {
  const {
    dapps,
    pinnedDapps: _pinnedDapps,
    unpinnedDapps: _unpinnedDapps,
  } = useTabedDapps();

  const openDapp = useOpenDapp();

  const [renamingDapp, setRenamingDapp] = useState<IDapp | null>(null);
  const [deletingDapp, setDeletingDapp] = useState<IDapp | null>(null);
  const [search, setSearch] = useState('');

  const debouncedSearch = useDebounce(search, { wait: 200 });

  const { pinnedDapps, unpinnedDapps } = useMemo(() => {
    return {
      pinnedDapps: findDapps(_pinnedDapps, debouncedSearch),
      unpinnedDapps: findDapps(_unpinnedDapps, debouncedSearch),
    };
  }, [debouncedSearch, _pinnedDapps, _unpinnedDapps]);

  const isNoResults = useMemo(
    () => !pinnedDapps?.length && !unpinnedDapps?.length,
    [pinnedDapps?.length, unpinnedDapps?.length]
  );

  const onClickDapp: IOnOpDapp = useCallback(
    (op, dapp: IDapp) => {
      switch (op) {
        case 'unpin': {
          toggleDappPinned([dapp.id], false);
          break;
        }
        case 'pin': {
          toggleDappPinned([dapp.id], true);
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
        case 'open': {
          if (dapp?.origin) {
            openDapp(dapp?.origin);
          }
          break;
        }
        default:
          break;
      }
    },
    [openDapp]
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
          content: 'All Dapps have been disconnected',
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
          content: 'All Dapps have been closed',
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
          <div className={style.extra}>
            <RabbyInput
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
              }}
              className={style.search}
              placeholder="Search Dapps"
              spellCheck={false}
              suffix={
                <img
                  className="cursor-pointer w-[18px] h-[18px]"
                  src="rabby-internal://assets/icons/add-dapp/icon-search.svg"
                />
              }
            />
            <Dropdown
              overlayClassName="dapps-dropdown-operations"
              trigger={['click']}
              overlay={
                <Menu
                  onClick={({ key }) => {
                    switch (key) {
                      case 'dapp-disconnect-all':
                        handleDisconnectAll();
                        break;
                      case 'dapp-close-all':
                        handleCloseAll();
                        break;
                      default:
                        break;
                    }
                  }}
                  items={[
                    {
                      key: 'dapp-disconnect-all',
                      className: 'dapp-dropdown-item',
                      label: <span className="text">Disconnect All Dapps</span>,
                      icon: (
                        <img
                          className="dapp-dropdown-item-icon"
                          src="rabby-internal://assets/icons/sidebar-context-menu/icon-disconnect-all.svg"
                        />
                      ),
                    },
                    {
                      key: 'dapp-close-all',
                      className: 'dapp-dropdown-item',
                      label: <span className="text">Close All Dapps</span>,
                      icon: (
                        <img
                          className="dapp-dropdown-item-icon"
                          src="rabby-internal://assets/icons/sidebar-context-menu/icon-close-all.svg"
                        />
                      ),
                    },
                  ]}
                />
              }
            >
              <img
                src="rabby-internal://assets/icons/dapps/icon-more.svg"
                className={style.extraMore}
              />
            </Dropdown>
          </div>
        </header>
        <main className={style.main}>
          {dapps?.length ? (
            <>
              {!isNoResults ? (
                <div className="dapps">
                  <div className="dapp-matrix">
                    <SortableList
                      data={pinnedDapps}
                      otherData={unpinnedDapps}
                      disabled={!!search?.trim()}
                      onChange={(v) => {
                        setDappsOrder({
                          pinnedList: v.map((item) => item.id),
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
                      otherData={pinnedDapps}
                      disabled={!!search?.trim()}
                      onChange={(v) => {
                        setDappsOrder({
                          unpinnedList: v.map((item) => item.id),
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
                <NoResults />
              )}
            </>
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
