import React, { useRef, useLayoutEffect } from 'react';
import { message } from 'antd';

import { RcIconToastSuccess } from '@/../assets/icons/global-toast';
import classNames from 'classnames';
import { useClickOutSide } from '@/renderer/hooks/useClick';
import { isWeb3Addr } from '@/isomorphic/web3';
import { isMainWinShellWebUI } from '@/isomorphic/url';
import { useZPopupViewState } from '@/renderer/hooks/usePopupWinOnMainwin';
import { TOAST_TOP } from '@/isomorphic/constants';

message.config({
  top: TOAST_TOP,
});

const TIMEOUT_SEC = 3;

type OpenParamters = Parameters<typeof message.open>;

export function toastMessage(config: OpenParamters[0]) {
  message.open({
    className: classNames(config.className || 'mainwindow-default-tip'),
    ...(config.type === 'success' && {
      icon: (
        <span
          role="img"
          aria-label="check-circle"
          className="anticon anticon-check-circle"
        >
          <RcIconToastSuccess className="w-[20px] h-[20px]" />
        </span>
      ),
    }),
    ...config,
    // duration: 10000,
  });
}

const TOAST_KEY = 'addr-copied-toast';

function ToastContent({
  children,
  onClickOutside,
  ...props
}: React.PropsWithChildren<{
  onClickOutside?: (sourceEvt?: MouseEvent) => void;
}>) {
  const clickRef = useRef<any>(null);

  useClickOutSide(clickRef, (e) => {
    onClickOutside?.(e);
  });

  return (
    <div {...props} ref={clickRef}>
      {children}
    </div>
  );
}

const inMainWin = isMainWinShellWebUI(window.location.href);

export function toastCopied(
  text: string,
  options?: {
    triggerEl?: HTMLElement | EventTarget;
  }
) {
  toastMessage({
    icon: null,
    key: TOAST_KEY,
    content: (
      <ToastContent
        onClickOutside={(sourceEvt) => {
          if (inMainWin) return;
          if (
            options?.triggerEl instanceof Element &&
            (sourceEvt?.target as HTMLElement)?.contains(
              options?.triggerEl as any
            )
          ) {
            return;
          }

          message.destroy(TOAST_KEY);
        }}
      >
        <div className="flex items-center">
          <RcIconToastSuccess className="mr-6px w-[16px] h-[16px]" />
          <span style={{ color: '#27C193' }}>Copied:</span>
        </div>
        <div className="text-12">{text}</div>
      </ToastContent>
    ),
    duration: TIMEOUT_SEC,
  });
}

export async function toastCopiedWeb3Addr(
  text: string,
  options?: {
    triggerEl?: HTMLElement | EventTarget;
  }
) {
  if (isWeb3Addr(text)) {
    toastCopied(text, options);
  }
}

export default function TransparentToast() {
  return <>{/* <ToastSecurityNotification /> */}</>;
}

export const ToastZPopupMessage = () => {
  const { svVisible, svState, closeSubview } = useZPopupViewState(
    'toast-zpopup-message'
  );

  useLayoutEffect(() => {
    if (svVisible) {
      toastMessage({
        ...svState,
        className: classNames(
          svState.className,
          'zpopup-toast',
          'mainwindow-default-tip'
        ),
        content: (
          <ToastContent onClickOutside={closeSubview}>
            {svState.content}
          </ToastContent>
        ),
        onClose: closeSubview,
      });
    }
  }, [svVisible, svState, closeSubview]);

  return null;
};
