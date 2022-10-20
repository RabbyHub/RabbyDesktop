import { notification } from 'antd'
import { IS_RUNTIME_PRODUCTION } from 'isomorphic/constants';
import { useEffect, useLayoutEffect } from 'react'

import styles from './SecurityNotifications.module.less';

const ICON_CLOSE = 'rabby-internal://assets/icons/security-notifications/icon-close.svg';

const ICON_SHILED_DEFAULT = 'rabby-internal://assets/icons/security-notifications/icon-shield-default.svg';
const ICON_SHILED_WARNING = 'rabby-internal://assets/icons/security-notifications/icon-shield-warning.svg';
const ICON_SHILED_DANGER = 'rabby-internal://assets/icons/security-notifications/icon-shield-danger.svg';

const DEFAULT_DURACTION_SEC = 3;

notification.config({ maxCount: 3 });

let notiCount = 0;
let closeTimer = -1;

function notify(payload: {
  web3Address: string,
  balance?: number | string
}) {
  notiCount++;
  notification.open({
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

export default function SecurityNotifications() {
  useEffect(() => {
    window.rabbyDesktop.ipcRenderer.on('__internal_rpc:clipboard:full-web3-addr', ({ web3Address }) => {
      notify({
        web3Address,
      })
    });
  }, []);

  useLayoutEffect(() => {
    // // just for test
    if (!IS_RUNTIME_PRODUCTION) {
      // notify({
      //   web3Address: '0x5853ed4f26a3fcea565b3fbc698bb19cdf6deb85',
      //   balance: '32,435'
      // });

      // document.body.classList.add('highlight-bg');
    }
  }, []);

  if (IS_RUNTIME_PRODUCTION) {

  }

  return <div className={styles.debugContent}>
    Nothing
  </div>
}
