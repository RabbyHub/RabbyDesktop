/* eslint-disable no-underscore-dangle, @typescript-eslint/no-shadow */
/* eslint-disable jsx-a11y/no-noninteractive-element-interactions, jsx-a11y/alt-text */
/// <reference types="chrome" />
/// <reference path="../../preload.d.ts" />

import React from 'react';

import classNames from 'classnames';

import { useWindowState } from '@/renderer/hooks-shell/useWindowState';

import {
  IconDarwinTripleClose,
  IconDarwinTripleFullscreen,
  IconDarwinTripleHoverClose,
  IconDarwinTripleHoverFullscreen,
  IconDarwinTripleHoverMinimize,
  IconDarwinTripleHoverRecover,
  IconDarwinTripleMinimize,
} from '@/../assets/icons/native-tabs-triples';

import {
  IconTrafficWin32Close,
  IconTrafficWin32Maxmize,
  IconTrafficWin32Minimize,
  IconTrafficWin32Recover,
} from '@/../assets/icons/titlebar-triples';

import { detectClientOS } from '@/isomorphic/os';
import styles from './index.module.less';
import DarwinDraggableGasket from '../DarwinDraggableGasket';

type CustomElement<T> = Partial<T & React.DOMAttributes<T> & { children: any }>;
declare global {
  /* eslint-disable-next-line @typescript-eslint/no-namespace */
  namespace JSX {
    interface IntrinsicElements {
      ['browser-action-list']: CustomElement<{ id: string }>;
    }
  }
}

const isDarwin = detectClientOS() === 'darwin';

export default function Titlebar(
  _: React.PropsWithChildren<{
    immersed?: boolean;
  }>
) {
  const {
    osType: winOSType,
    winState,
    disabledMinimizeButton,
    onMinimizeButton,
    onWindowsMaximizeButton,
    onDarwinToggleMaxmize,
    onFullscreenButton,
    onCloseButton,
  } = useWindowState();

  return (
    <div
      className={classNames(
        styles.titlebar,
        winOSType === 'darwin' && styles['os-darwin'],
        winOSType === 'win32' && styles['os-win32']
      )}
    >
      {winOSType === 'darwin' && (
        <div
          className={styles.macosControls}
          onDoubleClick={onDarwinToggleMaxmize}
        >
          <div className={styles.macosControlsInner}>
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
              disabled={disabledMinimizeButton}
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
              className={classNames(
                styles.control,
                styles['triple-fullscreen']
              )}
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
          {isDarwin && (
            <DarwinDraggableGasket className={styles.draggableGasket} />
          )}
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
            onClick={onWindowsMaximizeButton}
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
