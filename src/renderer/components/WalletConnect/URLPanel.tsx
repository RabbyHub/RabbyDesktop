import { Button, message } from 'antd';
import clsx from 'clsx';
import React from 'react';
import { useCopyToClipboard } from 'react-use';
import styles from './WalletConnectModal.module.less';

export interface Props {
  uri: string;
  onReload: () => void;
}

export const URLPanel: React.FC<Props> = ({ uri, onReload }) => {
  const [, copyToClipboard] = useCopyToClipboard();

  const onCopy = React.useCallback(() => {
    copyToClipboard(uri);
    message.success('Copied');
  }, [uri, copyToClipboard]);

  return (
    <div className="flex">
      <div className={clsx(styles.Panel, 'bg-[#FFFFFF1A] w-[360px] h-[200px]')}>
        <div className="break-all">{uri}</div>
        <div className="absolute bottom-8 right-8">
          <Button
            onClick={onReload}
            type="link"
            icon={
              <img src="rabby-internal://assets/icons/walletconnect/refresh.svg" />
            }
          />
          <Button
            onClick={onCopy}
            type="link"
            icon={
              <img src="rabby-internal://assets/icons/walletconnect/copy.svg" />
            }
          />
        </div>
      </div>
    </div>
  );
};
