import QRCode from 'qrcode.react';
import React from 'react';
import clsx from 'clsx';
import { Spin } from 'antd';
import styles from './WalletConnectModal.module.less';

export interface Props {
  uri: string;
  onReload: () => void;
}

export const QRCodePanel: React.FC<Props> = ({ uri, onReload }) => {
  return (
    <div className="flex">
      <div className={styles.Panel}>
        <div className="bg-white p-4 rounded">
          {!uri ? (
            <div
              className={clsx(
                'bg-white bg-opacity-70 w-[170px] h-[170px]',
                'flex items-center justify-center'
              )}
            >
              <Spin />
            </div>
          ) : (
            <QRCode value={uri} size={170} />
          )}
        </div>

        {/* {isHover && (
          <div className={styles.ReloadMask} onClick={onReload}>
            <div className={styles.Icon}>
              <img src="rabby-internal://assets/icons/walletconnect/refresh.svg" />
            </div>
          </div>
        )} */}
      </div>
    </div>
  );
};
