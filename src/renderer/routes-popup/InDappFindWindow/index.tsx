import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import clsx from 'clsx';

import { usePopupViewInfo } from '@/renderer/hooks/usePopupWinOnMainwin';
import RabbyInput from '@/renderer/components/AntdOverwrite/Input';
import { useBodyClassNameOnMounted } from '@/renderer/hooks/useMountedEffect';
import { Divider, InputRef } from 'antd';

import { RcIconClose, RcIconDown } from '@/../assets/icons/in-dapp-finder';
import { createGlobalStyle, css } from 'styled-components';
import { IS_RUNTIME_PRODUCTION } from '@/isomorphic/constants';
import { InDappFindSizes } from '@/isomorphic/const-size-next';
import styles from './index.module.less';

const Gasket = createGlobalStyle`
  html {
    background: transparent;
    /* ${
      !IS_RUNTIME_PRODUCTION &&
      css`
        background: rgba(var(--color-primary-rgb), 0.3);
      `
    } */
  }

  body.InDappFindWindowBody {
    overflow: hidden;
    user-select: none;

    #root {
      height: 100%;
      padding-right: ${InDappFindSizes.shadowRightOffset}px;
    }

    .InDappFindWindow {
      height: calc(100% - ${InDappFindSizes.shadowBottomOffset}px);
    }
  }
`;

type FoundState = {
  tabId: number;
  result: Electron.Result | null;
};
export default function InDappFindWindow() {
  const { localVisible, pageInfo } = usePopupViewInfo('in-dapp-find');

  useBodyClassNameOnMounted('InDappFindWindowBody');

  const [searchInput, setSearchInput] = useState('');
  const [foundState, setFoundState] = useState<FoundState>({
    tabId: -1,
    result: null,
  });

  const inputRef = useRef<InputRef>(null);
  useEffect(() => {
    const inputWrapper = inputRef.current;
    if (!localVisible) {
      inputWrapper?.blur();
    } else {
      inputWrapper?.focus();
      inputWrapper?.input?.select();
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
      noPrev: activeMatchOrdinal <= 1,
      noNext: activeMatchOrdinal >= matches,
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

  if (!pageInfo?.searchInfo?.tabId) return null;

  return (
    <div className={clsx(styles.InDappFindWindow, 'InDappFindWindow')}>
      <Gasket />
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
            !matchesInfo.matches && styles.disabledOp,
            styles.findOpPrev
          )}
          onClick={() => {
            // if (matchesInfo.noPrev) return;

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
            styles.findOp,
            !matchesInfo.matches && styles.disabledOp
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
