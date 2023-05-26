import { forwardMessageTo } from '@/renderer/hooks/useViewsMessage';
import { walletController } from '@/renderer/ipcRequest/rabbyx';
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

  const onUpdateAliasName = React.useCallback(
    async (e: any) => {
      if (e.type === 'keydown' && e.keyCode !== 13) {
        return;
      }
      await walletController.updateAlianName(address, aliasName);
      forwardMessageTo('*', 'refreshCurrentAccount', {});

      setIsEdit(false);
    },
    [address, aliasName]
  );

  return (
    <div className={styles.AddressItem}>
      <div className={styles.name}>
        <RabbyInput
          value={aliasName}
          onChange={(e) => setAliasName(e.target.value)}
          onBlur={onUpdateAliasName}
          onKeyDownCapture={onUpdateAliasName}
          autoFocus
          width="auto"
          className={styles.input}
          spellCheck={false}
        />
      </div>
      <div className={styles.address}>{address}</div>
    </div>
  );
};
