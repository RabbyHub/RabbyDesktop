import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import clsx from 'clsx';

import { usePopupWinInfo } from '@/renderer/hooks/usePopupWinOnMainwin';
import RabbyInput from '@/renderer/components/AntdOverwrite/Input';
import { useBodyClassNameOnMounted } from '@/renderer/hooks/useMountedEffect';
import { Divider, InputRef } from 'antd';

import { RcIconClose, RcIconDown } from '@/../assets/icons/in-dapp-finder';
import styles from './index.module.less';

type FoundState = {
  tabId: number;
  result: Electron.Result | null;
};
export default function InDappFindWindow() {
  const { localVisible, pageInfo } = usePopupWinInfo('in-dapp-find');

  useBodyClassNameOnMounted('InDappFindWindowBody');

  const [searchInput, setSearchInput] = useState('');
  const [foundState, setFoundState] = useState<FoundState>({
    tabId: -1,
    result: null,
  });

  const inputRef = useRef<InputRef>(null);
  useEffect(() => {
    if (!localVisible) return;

    const inputWrapper = inputRef.current;
    if (inputWrapper) {
      inputWrapper.focus();
      inputWrapper.input?.select();
    }
  }, [localVisible]);

  useEffect(() => {
    return window.rabbyDesktop.ipcRenderer.on(
      '__internal_push:mainwindow:update-findresult-in-page',
      (payload) => {
        if (payload.find) setSearchInput(payload.find.searchText || '');

        setFoundState({
          tabId: payload.tabId,
          result: payload.find?.result || null,
        });
      }
    );
  }, []);

  const matchesInfo = useMemo(() => {
    const activeMatchOrdinal = foundState?.result?.activeMatchOrdinal || 0;
    const matches = foundState?.result?.matches || 0;

    return {
      activeMatchOrdinal,
      matches,
      disabledBackward: activeMatchOrdinal <= 1,
      disabledForward: activeMatchOrdinal >= matches,
    };
  }, [foundState?.result]);

  const onFindForward = useCallback(() => {
    window.rabbyDesktop.ipcRenderer.sendMessage(
      '__internal_rpc:mainwindow:op-find-in-page',
      {
        type: 'find-forward',
      }
    );
  }, []);

  if (!pageInfo?.searchInfo?.id) return null;

  return (
    <div className={styles.InDappFindWindow}>
      <div className={styles.inputWrapper}>
        <RabbyInput
          value={searchInput}
          placeholder="Find in Dapp"
          size="large"
          ref={inputRef}
          className={styles.tokenInput}
          onChange={(evt) => {
            const nextInput = evt.target.value;
            setSearchInput(nextInput);

            window.rabbyDesktop.ipcRenderer.sendMessage(
              '__internal_rpc:mainwindow:op-find-in-page',
              {
                type: 'update-search-token',
                token: nextInput,
              }
            );
          }}
          onKeyDown={(evt) => {
            if (evt.key === 'Enter') {
              evt.stopPropagation();
              onFindForward();
            }
          }}
        />
        <div className={styles.foundMatchesInfo}>
          {matchesInfo.activeMatchOrdinal}/{matchesInfo.matches}
        </div>
      </div>
      <Divider type="vertical" className={styles.divider} />
      <div className={styles.findOps}>
        <div
          className={clsx(
            styles.findOp,
            // matchesInfo.disabledBackward && styles.disabled,
            styles.findOpPrev
          )}
          onClick={() => {
            // if (matchesInfo.disabledBackward) return;

            window.rabbyDesktop.ipcRenderer.sendMessage(
              '__internal_rpc:mainwindow:op-find-in-page',
              {
                type: 'find-backward',
              }
            );
          }}
        >
          <RcIconDown />
        </div>

        <div
          className={clsx(
            styles.findOp
            // matchesInfo.disabledForward && styles.disabled
          )}
          onClick={onFindForward}
        >
          <RcIconDown />
        </div>

        <div
          className={clsx(styles.findOp, styles.findOpClose)}
          onClick={() => {
            window.rabbyDesktop.ipcRenderer.sendMessage(
              '__internal_rpc:mainwindow:op-find-in-page',
              {
                type: 'stop-find',
              }
            );
            setSearchInput('');
          }}
        >
          <RcIconClose />
        </div>
      </div>
    </div>
  );
}
