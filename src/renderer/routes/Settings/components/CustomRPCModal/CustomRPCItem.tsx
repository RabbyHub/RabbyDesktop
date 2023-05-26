import { Switch } from '@/renderer/components/Switch/Switch';
import { RPCItem } from '@/isomorphic/types/rabbyx';
import { CHAINS } from '@/renderer/utils/constant';
import { useMemo, useState } from 'react';
import ChainIcon from '@/renderer/components/ChainIcon';
import { DeleteWrapper } from '@/renderer/components/DeleteWrapper';
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
    return CHAINS[data.id];
  }, [data.id]);

  return (
    <DeleteWrapper
      timeout={0}
      className={styles.part}
      onCancelDelete={() => {
        setIsShowCheck(false);
      }}
      onConfirmDelete={() => {
        onDelete?.(data?.id);
        setIsShowCheck(false);
      }}
      showClose={isShowCheck}
    >
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
              setIsShowCheck(true);
            }}
          />
        </div>
      </div>
    </DeleteWrapper>
  );
};
