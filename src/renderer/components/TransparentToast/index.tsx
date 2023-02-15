import React, { useMemo, useRef } from 'react';
import { message } from 'antd';

import { RcIconToastSuccess } from '@/../assets/icons/global-toast';
import { useZPopupViewState } from '@/renderer/hooks/usePopupWinOnMainwin';
import classNames from 'classnames';
import { useClickOutSide } from '@/renderer/hooks/useClick';

const TIMEOUT = 3000;

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

export default function TransparentToast() {
  const timerRef = useRef<any>();

  const clickRef = useRef<any>(null);
  const ToastContent = useMemo(() => {
    return ({
      children,
      ...props
    }: React.PropsWithChildren<{ foo?: string }>) => {
      return (
        <div {...props} ref={clickRef}>
          {children}
        </div>
      );
    };
  }, []);

  const { closeSubview, svVisible } = useZPopupViewState(
    'security-notification',
    (payload) => {
      if (payload?.state?.type === 'full-web3-addr') {
        toastMessage({
          icon: null,
          key: TOAST_KEY,
          content: (
            <ToastContent>
              <div className="flex items-center">
                <RcIconToastSuccess className="mr-6px w-[16px] h-[16px]" />
                Copied:
              </div>
              <div>{payload.state.web3Addr}</div>
            </ToastContent>
          ),
          onClose: () => {
            closeSubview();
          },
          duration: TIMEOUT,
        });

        if (timerRef.current) {
          clearTimeout(timerRef.current);
        }
        timerRef.current = setTimeout(() => {
          message.destroy(TOAST_KEY);
          timerRef.current = undefined;
          closeSubview();
        }, TIMEOUT);
      }
    }
  );

  useClickOutSide(clickRef, () => {
    if (!svVisible) return;

    message.destroy(TOAST_KEY);
    closeSubview();
  });

  return null;
}
