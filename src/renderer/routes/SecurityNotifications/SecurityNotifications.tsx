import { Divider, notification } from 'antd'
import { NotificationApi, NotificationInstance } from 'antd/lib/notification';
import classNames from 'classnames';
import { IS_RUNTIME_PRODUCTION } from 'isomorphic/constants';
import React, { useEffect, useLayoutEffect, useRef } from 'react'

import styles from './SecurityNotifications.module.less';

const ICON_CLOSE = 'rabby-internal://assets/icons/security-notifications/icon-close.svg';

const ICON_HEADER_BG_LOGO = 'rabby-internal://assets/icons/security-notifications/header-bg-logo.svg';

const ICON_SHILED_DEFAULT = 'rabby-internal://assets/icons/security-notifications/icon-shield-default.svg';
const ICON_SHILED_WARNING = 'rabby-internal://assets/icons/security-notifications/icon-shield-warning.svg';
const ICON_SHILED_DANGER = 'rabby-internal://assets/icons/security-notifications/icon-shield-danger.svg';

const DEFAULT_DURACTION_SEC = IS_RUNTIME_PRODUCTION ? 3 : 0;

const ROOT_EL = document.querySelector('#root')! as HTMLDivElement;
notification.config({
  maxCount: 2,
  top: 2,
});

let notiCount = 0;
let closeTimer = -1;

function CardHeader ({
  iconUrl = ICON_SHILED_DEFAULT,
  text = '',
  children,
} : React.PropsWithChildren<{
  iconUrl?: string;
  text?: React.ReactNode
}>) {
  return (
    <div className={styles.header}>
      <img className={styles.headerLogoBg} src={ICON_HEADER_BG_LOGO} alt="background" />
      <img className={styles.headerIcon} src={iconUrl} alt="icon" />
      {children || text || null}
    </div>
  )
}

function notify({
  container,
  notificationEvent
}: {
  container?: HTMLElement,
  notificationEvent: ISecurityNotificationPayload
}, api: NotificationInstance | NotificationApi = notification) {
  notiCount++;
  api.open({
    getContainer: () => container || ROOT_EL,
    className: classNames(
      styles.J_notification,
      notificationEvent.type === 'full-web3-addr' && styles.evtWeb3AddrDetected,
      notificationEvent.type === 'full-web3-addr-changed' && styles.evtWeb3AddrChanged,

      notificationEvent.type === 'full-web3-addr-quick-changed' && styles.evtWeb3AddrChanged,
      notificationEvent.type === 'full-web3-addr-quick-changed' && styles.isDanger,
    ),
    placement: 'topRight',
    closeIcon: (
      <img src={ICON_CLOSE} className={styles.closeIcon} />
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
    },
    message: (
      <CardHeader />
    ),
    ...notificationEvent.type === 'full-web3-addr' && {
      message: (
        <CardHeader>
          <span className={styles.headerText}>Address copied. Please check carefully.</span>
        </CardHeader>
      ),
      // btn: <button>Click me!</button>,
      description: (
        <div className={styles.securityNotifyContent}>
          <p className={styles.addr}>{notificationEvent.web3Addr}</p>
          {/* {notificationEvent.balance && <span className={styles.balance}>Balance: ${notificationEvent.balance}</span>} */}
        </div>
      ),
    },
    ...notificationEvent.type === 'full-web3-addr-changed' && {
      message: (
        <CardHeader iconUrl={ICON_SHILED_WARNING}>
          <span className={styles.headerText}>Sensitive information in your clipboard has been changed. Please compare carefully.</span>
        </CardHeader>
      ),
      // btn: <button>Click me!</button>,
      description: (
        <div className={styles.descriptionInner}>
          <div className={styles.securityNotifyContent}>
            <div className={styles.label}>Current: </div>
            <p className={styles.addr}>{notificationEvent.curAddr}</p>
          </div>
          <Divider className={styles.divider} />
          <div className={styles.securityNotifyContent}>
            <div className={styles.label}>Previous: </div>
            <p className={styles.addr}>{notificationEvent.prevAddr}</p>
          </div>
        </div>
      ),
    },
    ...notificationEvent.type === 'full-web3-addr-quick-changed' && {
      message: (
        <CardHeader iconUrl={ICON_SHILED_WARNING}>
          <span className={styles.headerText}>Found sensitive information changes in clipboard in a second , beware of malicious tampering.</span>
        </CardHeader>
      ),
      // btn: <button>Click me!</button>,
      description: (
        <div className={styles.descriptionInner}>
          <div className={styles.securityNotifyContent}>
            <div className={styles.label}>After the change: </div>
            <p className={styles.addr}>{notificationEvent.curAddr}</p>
          </div>
          <Divider className={styles.divider} />
          <div className={styles.securityNotifyContent}>
            <div className={styles.label}>Before the change: </div>
            <p className={styles.addr}>{notificationEvent.prevAddr}</p>
          </div>
        </div>
      ),
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
    window.rabbyDesktop.ipcRenderer.on('__internal_rpc:security-notification', (notificationEvent) => {
      notify({
        notificationEvent,
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
      // notify({
      //   web3Address: '0x5853ed4f26a3fcea565b3fbc698bb19cdf6deb85',
      //   balance: '32,435',
      //   container: notificationWrapperRef.current!,
      // }, notifyApi);

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
