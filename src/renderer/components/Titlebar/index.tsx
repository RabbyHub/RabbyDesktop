/* eslint-disable no-underscore-dangle, @typescript-eslint/no-shadow */
/* eslint-disable jsx-a11y/no-noninteractive-element-interactions, jsx-a11y/alt-text */
/// <reference types="chrome" />
/// <reference path="../../preload.d.ts" />

import React from 'react';

import classNames from 'classnames';

import { useWindowState } from '@/renderer/hooks-shell/useWindowState';

import {
  IconDarwinTripleClose,
  IconDarwinTripleMinimize,
  IconDarwinTripleFullscreen,
  IconDarwinTripleHoverClose,
  IconDarwinTripleHoverMinimize,
  IconDarwinTripleHoverFullscreen,
  IconDarwinTripleHoverRecover,
} from '@/../assets/icons/native-tabs-triples';

import {
  IconTrafficWin32Close,
  IconTrafficWin32Maxmize,
  IconTrafficWin32Recover,
  IconTrafficWin32Minimize,
} from '@/../assets/icons/titlebar-triples';

import { useSettings } from '@/renderer/hooks/useSettings';
import styles from './index.module.less';

type CustomElement<T> = Partial<T & React.DOMAttributes<T> & { children: any }>;
declare global {
  /* eslint-disable-next-line @typescript-eslint/no-namespace */
  namespace JSX {
    interface IntrinsicElements {
      ['browser-action-list']: CustomElement<{ id: string }>;
    }
  }
}

export default function Titlebar(
  _: React.PropsWithChildren<{
    immersed?: boolean;
  }>
) {
  const {
    osType: winOSType,
    winState,
    onMinimizeButton,
    onMaximizeButton,
    onDarwinToggleMaxmize,
    onFullscreenButton,
    onCloseButton,
  } = useWindowState();

  const { settings } = useSettings();

  return (
    <div
      className={classNames(
        styles.titlebar,
        settings.sidebarCollapsed && styles.isFold,
        winOSType === 'darwin' && styles['os-darwin'],
        winOSType === 'win32' && styles['os-win32']
      )}
    >
      {winOSType === 'darwin' && (
        <div
          className={styles['macos-controls']}
          onDoubleClick={onDarwinToggleMaxmize}
        >
          <button
            type="button"
            className={classNames(styles.control, styles['triple-close'])}
            onClick={onCloseButton}
          >
            <img src={IconDarwinTripleClose} alt="close" />
            <img
              className={styles['hover-show']}
              src={IconDarwinTripleHoverClose}
              alt="close"
            />
          </button>
          <button
            type="button"
            className={classNames(styles.control, styles['triple-minimize'])}
            onClick={onMinimizeButton}
          >
            <img src={IconDarwinTripleMinimize} alt="minimize" />
            <img
              className={classNames(styles['hover-show'])}
              src={IconDarwinTripleHoverMinimize}
              alt="minimize"
            />
          </button>
          <button
            type="button"
            className={classNames(styles.control, styles['triple-fullscreen'])}
            onClick={onFullscreenButton}
          >
            {winState === 'fullscreen' ? (
              <>
                <img src={IconDarwinTripleFullscreen} alt="fullscreen" />
                <img
                  className={classNames(styles['hover-show'])}
                  src={IconDarwinTripleHoverRecover}
                  alt="fullscreen"
                />
              </>
            ) : (
              <>
                <img src={IconDarwinTripleFullscreen} alt="fullscreen" />
                <img
                  className={classNames(styles['hover-show'])}
                  src={IconDarwinTripleHoverFullscreen}
                  alt="fullscreen"
                />
              </>
            )}
          </button>
        </div>
      )}
      <div
        className={styles['app-drag']}
        onDoubleClick={onDarwinToggleMaxmize}
      />
      {winOSType === 'win32' && (
        <div className={styles['window-controls']}>
          <button
            type="button"
            className={classNames(styles.control, styles['triple-minimize'])}
            onClick={onMinimizeButton}
          >
            <img src={IconTrafficWin32Minimize} alt="minimize" />
          </button>
          <button
            type="button"
            className={classNames(styles.control, styles['triple-maximize'])}
            onClick={onMaximizeButton}
          >
            <img
              src={
                winState === 'maximized'
                  ? IconTrafficWin32Recover
                  : IconTrafficWin32Maxmize
              }
              alt="maximize"
            />
          </button>
          <button
            type="button"
            className={classNames(styles.control, styles['triple-close'])}
            onClick={onCloseButton}
          >
            <img src={IconTrafficWin32Close} alt="close" />
          </button>
        </div>
      )}
    </div>
  );
}
