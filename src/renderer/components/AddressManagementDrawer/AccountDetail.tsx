import React from 'react';
import { IDisplayedAccountWithBalance } from '@/renderer/hooks/rabbyx/useAccountToDisplay';
import styles from './AddressManagementDrawer.module.less';

export interface Props {
  onClose: () => void;
  account: IDisplayedAccountWithBalance;
}

export const AccountDetail: React.FC<Props> = ({ onClose, account }) => {
  return <div className={styles.AccountDetail}>123</div>;
};
