import React, { useRef } from 'react';
import { message } from 'antd';

import { RcIconToastSuccess } from '@/../assets/icons/global-toast';
import { useZPopupViewState } from '@/renderer/hooks/usePopupWinOnMainwin';
import classNames from 'classnames';
import { useClickOutSide } from '@/renderer/hooks/useClick';
import { isWeb3Addr } from '@/isomorphic/web3';

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

const TOAST_KEY = 'addr-changed-toast';

function ToastContent({
  children,
  onClickOutside,
  ...props
}: React.PropsWithChildren<{
  onClickOutside?: () => void;
}>) {
  const clickRef = useRef<any>(null);

  useClickOutSide(clickRef, () => {
    onClickOutside?.();
  });

  return (
    <div {...props} ref={clickRef}>
      {children}
    </div>
  );
}

export async function toastCopiedWeb3Addr(text: string) {
  if (isWeb3Addr(text)) {
    toastMessage({
      icon: null,
      key: TOAST_KEY,
      content: (
        <ToastContent
          onClickOutside={() => {
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

function ToastSecurityNotification() {
  const timerRef = useRef<any>();

  const { closeSubview, svVisible } = useZPopupViewState(
    'security-notification',
    (payload) => {
      if (payload?.state?.type === 'full-web3-addr') {
        toastMessage({
          icon: null,
          key: TOAST_KEY,
          content: (
            <ToastContent
              onClickOutside={() => {
                if (!svVisible) return;

                message.destroy(TOAST_KEY);
                closeSubview();
              }}
            >
              <div className="flex items-center">
                <RcIconToastSuccess className="mr-6px w-[16px] h-[16px]" />
                <span style={{ color: '#27C193' }}>Copied:</span>
              </div>
              <div>{payload.state.web3Addr}</div>
            </ToastContent>
          ),
          onClose: () => {
            closeSubview();
          },
          duration: TIMEOUT_SEC,
        });

        if (timerRef.current) {
          clearTimeout(timerRef.current);
        }
        timerRef.current = setTimeout(() => {
          message.destroy(TOAST_KEY);
          timerRef.current = undefined;
          closeSubview();
        }, TIMEOUT_SEC * 1e3);
      }
    }
  );

  return null;
}

export default function TransparentToast() {
  return (
    <>
      <ToastSecurityNotification />
    </>
  );
}
