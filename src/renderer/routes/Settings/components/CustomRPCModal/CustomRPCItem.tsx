import { useMemo, useState } from 'react';
import { RPCItem } from '@/isomorphic/types/rabbyx';
import ChainIcon from '@/renderer/components/ChainIcon';
import { Switch } from '@/renderer/components/Switch/Switch';
import { findChain } from '@/renderer/utils/chain';
import styles from './index.module.less';

interface CustomtRPCItemProps {
  data: {
    id: CHAINS_ENUM;
    rpc: RPCItem;
  };
  onEdit?(data: CustomtRPCItemProps['data']): void;
  onEnable?(id: CHAINS_ENUM, v: boolean): void;
  onDelete?(id: CHAINS_ENUM): void;
}
export const CustomtRPCItem = (props: CustomtRPCItemProps) => {
  const { data, onEdit, onEnable, onDelete } = props;
  const [isShowCheck, setIsShowCheck] = useState(false);

  const chain = useMemo(() => {
    return findChain({
      enum: data.id,
    });
  }, [data.id]);

  return (
    <div className={styles.customRPCItem}>
      <div className={styles.switch}>
        <Switch
          checked={data?.rpc?.enable}
          onChange={(v) => onEnable?.(data.id, v)}
        />
      </div>
      <ChainIcon chain={data?.id} isShowCustomRPC className={styles.icon} />
      <div className={styles.rowContent}>
        <div className={styles.name}>{chain?.name}</div>
        <div className={styles.url} title={data?.rpc?.url}>
          {data?.rpc?.url}
        </div>
      </div>
      <div className={styles.action}>
        <img
          src="rabby-internal://assets/icons/mainwin-settings/icon-edit.svg"
          alt=""
          onClick={() => {
            onEdit?.(data);
          }}
        />
        <img
          src="rabby-internal://assets/icons/mainwin-settings/icon-delete.svg"
          alt=""
          onClick={() => {
            onDelete?.(data?.id);
          }}
        />
      </div>
    </div>
  );
};
