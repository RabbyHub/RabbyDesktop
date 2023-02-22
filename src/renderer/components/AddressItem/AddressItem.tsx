import { forwardMessageTo } from '@/renderer/hooks/useViewsMessage';
import { walletController } from '@/renderer/ipcRequest/rabbyx';
import { Button } from 'antd';
import React from 'react';
import RabbyInput from '../AntdOverwrite/Input';
import styles from './AddressItem.module.less';

interface Props {
  address: string;
  type: string;
  brandName: string;
}

export const AddressItem: React.FC<Props> = ({ address, type, brandName }) => {
  const [aliasName, setAliasName] = React.useState<string>('');
  const [isEdit, setIsEdit] = React.useState<boolean>(false);

  React.useEffect(() => {
    walletController.getAlianName(address).then((name) => {
      setAliasName(name);
    });
  }, [address]);

  const onUpdateAliasName = React.useCallback(async () => {
    await walletController.updateAlianName(address, aliasName);
    forwardMessageTo('*', 'refreshCurrentAccount', {});

    setIsEdit(false);
  }, [address, aliasName]);

  const shortAddress = `${address?.toLowerCase().slice(0, 6)}...${address
    ?.toLowerCase()
    .slice(-4)}`;

  return (
    <div className={styles.AddressItem}>
      <div className={styles.name}>
        {isEdit ? (
          <RabbyInput
            value={aliasName}
            onChange={(e) => setAliasName(e.target.value)}
            onBlur={onUpdateAliasName}
            onPressEnter={onUpdateAliasName}
            autoFocus
            width="auto"
            className={styles.input}
            spellCheck={false}
          />
        ) : (
          <span>{aliasName}</span>
        )}
        <Button
          className={styles.editButton}
          type="link"
          onClick={() => setIsEdit(true)}
        >
          <img
            className={styles.icon}
            src="rabby-internal://assets/icons/import/pen.svg"
            alt="edit"
          />
        </Button>
      </div>
      <div className={styles.address}>{shortAddress}</div>
    </div>
  );
};
