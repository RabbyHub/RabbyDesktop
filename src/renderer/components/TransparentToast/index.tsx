import React, { useRef } from 'react';
import { message } from 'antd';

import { RcIconToastSuccess } from '@/../assets/icons/global-toast';
import { useZPopupViewState } from '@/renderer/hooks/usePopupWinOnMainwin';
import classNames from 'classnames';
import { useClickOutSide } from '@/renderer/hooks/useClick';
import { isWeb3Addr } from '@/isomorphic/web3';
import { isMainWinShellWebUI } from '@/isomorphic/url';

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

export async function toastCopiedWeb3Addr(
  text: string,
  options?: {
    triggerEl?: HTMLElement | EventTarget;
  }
) {
  if (isWeb3Addr(text)) {
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
          <div>{text}</div>
        </ToastContent>
      ),
      duration: TIMEOUT_SEC,
    });
  }
}

export default function TransparentToast() {
  return <>{/* <ToastSecurityNotification /> */}</>;
}
