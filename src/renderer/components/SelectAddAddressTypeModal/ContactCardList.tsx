import clsx from 'clsx';
import React from 'react';
import { WALLET_BRAND_TYPES } from '@/renderer/utils/constant';
import { walletController } from '@/renderer/ipcRequest/rabbyx';
import { Modal } from 'antd';
import styles from './index.module.less';

interface Item {
  logo: string;
  bridge?: string;
  name: string;
  id: string;
  brand?: WALLET_BRAND_TYPES;
}

export interface Props {
  logo: string;
  title: string;
  list: Item[];
  onAction: (id: string, brand?: WALLET_BRAND_TYPES) => void;
}

export const ContactTypeCardList: React.FC<Props> = ({
  logo,
  list,
  title,
  onAction,
}) => {
  const checkQRBasedWallet = async (currentBrand: WALLET_BRAND_TYPES) => {
    const { allowed, brand } =
      await walletController.checkQRHardwareAllowImport(currentBrand);

    if (!allowed) {
      Modal.error({
        title: 'Unable to import',
        content: `Importing multiple QR-based hardware wallets is not supported. Please delete all addresses from ${brand} before importing another device.`,
        okText: 'OK',
        centered: true,
        maskClosable: true,
        wrapClassName: 'ErrorModal',
      });
      return false;
    }

    return true;
  };

  const handleClick = async (item: Item) => {
    if (item.brand) {
      if (await checkQRBasedWallet(item.brand)) {
        onAction(item.id, item.brand);
      }
      return;
    }
    onAction(item.id, item.brand);
  };

  return (
    <div className={clsx(styles.panel, styles.panelHD)}>
      <div className={styles.header}>
        <div className={styles.logo}>
          <img src={logo} />
        </div>
        <span className={styles.title}>{title}</span>
      </div>
      <div className={clsx(styles.body, 'gap-x-[10px] gap-y-[5px]')}>
        {list.map((item) => (
          <div onClick={() => handleClick(item)} className={styles.device}>
            <div className={styles.deviceLogo}>
              <img width="100%" src={item.logo} />
              {item.bridge && (
                <img
                  className="absolute -bottom-[3px] -right-[3px] w-[14px]"
                  src={item.bridge}
                />
              )}
            </div>
            <span className={styles.deviceName}>{item.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
