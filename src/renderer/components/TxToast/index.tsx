import {
  RcIconToastError,
  RcIconToastSuccess,
  RcIconToastTxSubmitted,
} from '@/../assets/icons/global-toast';
import RcIconExternalLink from '@/../assets/icons/tx-toast/external-link.svg?rc';
import {
  usePopupViewInfo,
  usePopupWinInfo,
  useZPopupViewState,
} from '@/renderer/hooks/usePopupWinOnMainwin';
import { CHAINS } from '@/renderer/utils/constant';
import { notification } from 'antd';
import clsx from 'clsx';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { openExternalUrl } from '@/renderer/ipcRequest/app';
import styles from './style.module.less';

const IconType = ({
  type,
  className,
}: Pick<TxNotificationProps, 'type'> & { className?: string }) => {
  if (type === 'submit') {
    return <RcIconToastTxSubmitted className={className} />;
  }

  if (type === 'failed') {
    return <RcIconToastError className={className} />;
  }
  return <RcIconToastSuccess className={className} />;
};
type TxNotificationProps = {
  type: 'success' | 'submit' | 'failed';
  chain: CHAINS_ENUM;
  hash?: string;
  title: string;
};

function ProgressBar({
  duration,
  id,
  onClose,
}: {
  duration: number;
  id: string;
  onClose: (id: string) => void;
}) {
  const divRef = useRef<HTMLDivElement>(null);
  const style = useMemo(
    () => ({
      animationDuration: `${duration}ms`,
    }),
    [duration]
  );

  return (
    <div>
      <div className={styles.progressTrack} />
      <div
        ref={divRef}
        style={style}
        className={styles.progressBar}
        onAnimationEnd={useCallback(() => {
          onClose(id);
        }, [id, onClose])}
      />
    </div>
  );
}

const openNotification = (
  p: TxNotificationProps & {
    onClose: (id: string) => void;
    onOpen: (id: string) => void;
  }
) => {
  const close = (id: string, closePopup = true) => {
    notification.close(id);
    if (closePopup) {
      p.onClose(id);
    }
  };
  const id = `${p.chain}-${p.hash}`;

  close(id, false);

  setTimeout(() => {
    notification.open({
      key: id,
      message: (
        <div className="flex gap-8 items-center">
          <IconType type={p.type} className="text-20" />
          <span
            className={clsx(
              'text-18 font-bold',
              p.type === 'submit' && 'text-blue-light',
              p.type === 'success' && 'text-green',
              p.type === 'failed' && 'text-red-forbidden'
            )}
          >
            {p.title}
          </span>
        </div>
      ),
      description: (
        <div>
          {p.hash && (
            <div
              className="text-white text-12 font-medium pl-[28px] flex items-center gap-8 cursor-pointer"
              onClick={() => {
                openExternalUrl(
                  `${CHAINS?.[p?.chain]?.scan.replace(/_s_/, p.hash)}`
                );
              }}
            >
              <span>View on {CHAINS?.[p?.chain]?.name} Explore</span>
              <RcIconExternalLink className="text-14" />
            </div>
          )}
          <ProgressBar
            duration={5000}
            id={id}
            onClose={close}
            key={`${p.type}-${id}`}
          />
        </div>
      ),
      onClick: () => {},
      onClose: () => {
        close(id);
      },
      placement: 'bottomRight',
      bottom: 16,
      duration: 0,
      icon: null,
      closeIcon: (
        <img
          src="rabby-internal://assets/icons/modal/close.svg"
          className="w-14"
        />
      ),
      className: styles.container,
    });
  }, 200);
};

function notifyAjudstSize(txNotificationCount: number) {
  window.rabbyDesktop.ipcRenderer.sendMessage(
    '__internal_rpc:popupview-on-mainwin:adjust-rect',
    {
      type: 'right-side-popup',
      contents: {
        txNotificationCount,
      },
    }
  );
}

export const TxToast = () => {
  const { pageInfo, hideView } = usePopupViewInfo('right-side-popup');
  const { chain, hash, type, title } = pageInfo?.state || {};

  const [_, setList] = useState<string[]>([]);

  const onClose = useCallback(
    (id: string) => {
      setList((l) => {
        const v = l.filter((e) => e !== id);
        if (v.length === 0) {
          hideView();
        } else {
          notifyAjudstSize(v.length);
        }

        return v;
      });
    },
    [hideView]
  );

  const onOpen = useCallback((id: string) => {
    setList((e) => {
      const result = [...e, id];
      notifyAjudstSize(result.length);

      return result;
    });
  }, []);

  useEffect(() => {
    if (title && type) {
      const id = `${chain}-${hash}`;
      onOpen(id);
      openNotification({
        chain,
        hash,
        type,
        title,
        onClose,
        onOpen,
      });
    }
  }, [chain, hash, type, title, onClose, onOpen]);
  return null;
};
