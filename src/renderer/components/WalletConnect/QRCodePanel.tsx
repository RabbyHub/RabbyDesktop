import QRCode from 'qrcode.react';
import React from 'react';
import styles from './WalletConnectModal.module.less';

export interface Props {
  uri: string;
  onReload: () => void;
}

export const QRCodePanel: React.FC<Props> = ({ uri, onReload }) => {
  const [isHover, setIsHover] = React.useState(false);

  return (
    <div className="flex">
      <div
        className={styles.Panel}
        onMouseMove={() => setIsHover(true)}
        onMouseLeave={() => setIsHover(false)}
      >
        <div className="bg-white p-4 rounded">
          <QRCode value={uri} size={170} />
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
