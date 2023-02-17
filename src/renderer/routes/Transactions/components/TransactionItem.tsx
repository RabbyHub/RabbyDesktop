import { TxDisplayItem, TxHistoryItem } from '@debank/rabby-api/dist/types';
import classNames from 'classnames';
import styles from '../index.module.less';
import { TxBasicInfo } from './TxBasicInfo';
import { TxChange } from './TxChange';
import { TxExtra } from './TxExtra';
import { TxInterAddressExplain } from './TxInterAddressExplain';

type TransactionItemProps = {
  data: TxDisplayItem | TxHistoryItem;
  site?: ConnectedSite;
} & Pick<TxDisplayItem, 'cateDict' | 'projectDict' | 'tokenDict'>;

export const TransactionItem = (props: TransactionItemProps) => {
  const { data, cateDict, projectDict, tokenDict, site } = props;
  // console.log(data, cateDict, projectDict, tokenDict);
  const isFailed = data.tx?.status === 0;
  return (
    <div className={classNames(styles.tx, isFailed && styles.txFailed)}>
      {isFailed && (
        <div className={styles.txStatusFailed}>
          <img
            src="rabby-internal://assets/icons/transaction/info.svg"
            alt=""
          />
          Failed
        </div>
      )}
      <TxBasicInfo data={data} />
      <TxInterAddressExplain
        data={data}
        cateDict={cateDict}
        projectDict={projectDict}
        tokenDict={tokenDict}
      />
      <TxChange data={data} tokenDict={tokenDict} />
      <TxExtra data={data} site={site} />
    </div>
  );
};
