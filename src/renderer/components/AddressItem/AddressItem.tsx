import { useAddressManagement } from '@/renderer/hooks/rabbyx/useAddressManagement';
import { walletController } from '@/renderer/ipcRequest/rabbyx';
import { Button, Input } from 'antd';
import React from 'react';
import styles from './AddressItem.module.less';

interface Props {
  address: string;
  type: string;
  brandName: string;
}

export const AddressItem: React.FC<Props> = ({ address, type, brandName }) => {
  const [aliasName, setAliasName] = React.useState<string>('');
  const [isEdit, setIsEdit] = React.useState<boolean>(false);
  const { getHighlightedAddressesAsync } = useAddressManagement();

  React.useEffect(() => {
    walletController.getAlianName(address).then((name) => {
      setAliasName(name);
    });
  }, [address]);

  const onUpdateAliasName = React.useCallback(() => {
    walletController
      .updateAlianName(address, aliasName)
      .then(() => getHighlightedAddressesAsync());

    setIsEdit(false);
  }, [address, aliasName, getHighlightedAddressesAsync]);

  const shortAddress = `${address?.toLowerCase().slice(0, 6)}...${address
    ?.toLowerCase()
    .slice(-4)}`;

  return (
    <div className={styles.AddressItem}>
      <div className={styles.name}>
        {isEdit ? (
          <Input
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
