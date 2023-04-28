import { TxDisplayItem, TxHistoryItem } from '@debank/rabby-api/dist/types';
import classNames from 'classnames';
import clsx from 'clsx';
import styles from '../index.module.less';
import { TxBasicInfo } from './TxBasicInfo';
import { TxChange } from './TxChange';
import { TxExtra } from './TxExtra';
import { TxInterAddressExplain } from './TxInterAddressExplain';

type TransactionItemProps = {
  data: TxDisplayItem | TxHistoryItem;
  origin?: string;
} & Pick<TxDisplayItem, 'cateDict' | 'projectDict' | 'tokenDict'>;

export const TransactionItem = (props: TransactionItemProps) => {
  const { data, cateDict, projectDict, tokenDict, origin } = props;
  const isFailed = data.tx?.status === 0;
  const isScam = data.is_scam;

  return (
    <div
      className={classNames(styles.tx, (isFailed || isScam) && styles.txGray)}
    >
      <div className={styles.badge}>
        {isScam && <div className={styles.tag}>Scam tx</div>}

        {isFailed && (
          <div className={clsx(styles.tag, styles.tagFailed)}>
            <img
              src="rabby-internal://assets/icons/transaction/info.svg"
              alt=""
            />
            Failed
          </div>
        )}
      </div>
      <TxBasicInfo data={data} />
      <TxInterAddressExplain
        data={data}
        cateDict={cateDict}
        projectDict={projectDict}
        tokenDict={tokenDict}
      />
      <TxChange data={data} tokenDict={tokenDict} />
      <TxExtra data={data} origin={origin} />
    </div>
  );
};
