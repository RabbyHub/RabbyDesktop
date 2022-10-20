import { notification } from 'antd'
import { NotificationApi, NotificationInstance } from 'antd/lib/notification';
import { IS_RUNTIME_PRODUCTION } from 'isomorphic/constants';
import { useEffect, useLayoutEffect, useRef } from 'react'

import styles from './SecurityNotifications.module.less';

const ICON_CLOSE = 'rabby-internal://assets/icons/security-notifications/icon-close.svg';

const ICON_SHILED_DEFAULT = 'rabby-internal://assets/icons/security-notifications/icon-shield-default.svg';
const ICON_SHILED_WARNING = 'rabby-internal://assets/icons/security-notifications/icon-shield-warning.svg';
const ICON_SHILED_DANGER = 'rabby-internal://assets/icons/security-notifications/icon-shield-danger.svg';

const DEFAULT_DURACTION_SEC = 3;

const ROOT_EL = document.querySelector('#root')! as HTMLDivElement;
notification.config({
  maxCount: 5,
  top: 2,
});

let notiCount = 0;
let closeTimer = -1;

function notify(payload: {
  container?: HTMLElement,
  web3Address: string,
  balance?: number | string
}, api: NotificationInstance | NotificationApi = notification) {
  notiCount++;
  api.open({
    getContainer: () => payload.container || ROOT_EL,
    className: styles.J_notification,
    placement: 'topRight',
    message: (
      <div className={styles.header}>
        <img className={styles.header_icon} src={ICON_SHILED_DEFAULT} alt="icon" />
        Address copied. Please check carefully.
      </div>
    ),
    closeIcon: (
      <img src={ICON_CLOSE} className={styles.closeIcon} />
    ),
    // btn: <button>Click me!</button>,
    description: (
      <div className={styles.typedFulltextWeb3addr}>
        <p className={styles.addr}>{payload.web3Address}</p>
        {payload.balance && <span className={styles.balance}>Balance: ${payload.balance}</span>}
      </div>
    ),
    duration: DEFAULT_DURACTION_SEC,
    onClose: () => {
      notiCount = Math.max(notiCount - 1, 0);

      if (notiCount === 0) {
        if (closeTimer) clearTimeout(closeTimer);
        closeTimer = setTimeout(() => {
          window.rabbyDesktop.ipcRenderer.sendMessage('__internal_rpc:clipboard:close-view');
        }, 300) as any as number;

      }
    }
  })
}

function toggleClickThrough(enable = true) {
  if (enable)
    window.rabbyDesktop.ipcRenderer.sendMessage('__internal_rpc:browser:set-ignore-mouse-events', true, { forward: true });
  else
    window.rabbyDesktop.ipcRenderer.sendMessage('__internal_rpc:browser:set-ignore-mouse-events', false, { forward: true });
}

export default function SecurityNotifications() {
  const [notifyApi, contextHolder] = notification.useNotification();
  const notificationWrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    window.rabbyDesktop.ipcRenderer.on('__internal_rpc:clipboard:full-web3-addr', ({ web3Address }) => {
      notify({
        web3Address,
        container: notificationWrapperRef.current!,
      }, notifyApi)
    });
  }, [ notifyApi ]);

  useLayoutEffect(() => {
    const wrapperNode = notificationWrapperRef.current!;

    const onEnter = () => {
      // const allContentNodes = Array.from(wrapperNode.querySelectorAll('.ant-notification-notice-content, .ant-notification-notice-close'));
      toggleClickThrough(false);
    }

    const onLeave = () => {
      // const allContentNodes = Array.from(wrapperNode.querySelectorAll('.ant-notification-notice-content, .ant-notification-notice-close'));
      toggleClickThrough(true);
    }

    wrapperNode.addEventListener('mouseenter', onEnter);
    wrapperNode.addEventListener('mouseleave', onLeave);

    return () => {
      toggleClickThrough(false);
      wrapperNode.removeEventListener('mouseenter', onEnter);
      wrapperNode.removeEventListener('mouseleave', onLeave);
    }
  }, []);

  useLayoutEffect(() => {
    // // just for test
    if (!IS_RUNTIME_PRODUCTION) {
      notify({
        web3Address: '0x5853ed4f26a3fcea565b3fbc698bb19cdf6deb85',
        balance: '32,435',
        container: notificationWrapperRef.current!,
      }, notifyApi);

      // // show highlight background for debug
      // document.body.classList.add('highlight-bg');
    }
  }, [ notifyApi ]);

  return (
    <div ref={notificationWrapperRef} className='notification-wrapper'>
      <div className={styles.debugContent}>
        Nothing
      </div>
      {contextHolder}
    </div>
  )
}
