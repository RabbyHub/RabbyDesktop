import { TransactionWebsite } from '@/renderer/components/TransactionWebsite';
import { getChain } from '@/renderer/utils';
import { numberWithCommasIsLtOne } from '@/renderer/utils/number';
import {
  TxDisplayItem,
  TxHistoryItem,
} from '@rabby-wallet/rabby-api/dist/types';
import classNames from 'classnames';
import styles from '../index.module.less';

interface TxExtraProps {
  data: TxDisplayItem | TxHistoryItem;
  origin?: string;
}

export const TxExtra = ({ data, origin }: TxExtraProps) => {
  const chain = getChain(data.chain);
  return (
    <div className={classNames(styles.txExtra, styles.colTxExtra)}>
      {data.tx && data.tx?.eth_gas_fee ? (
        <div className={styles.txGas}>
          GasFee: {numberWithCommasIsLtOne(data.tx?.eth_gas_fee, 4)}{' '}
          {chain?.nativeTokenSymbol} ($
          {numberWithCommasIsLtOne(data.tx?.usd_gas_fee ?? 0, 2)})
        </div>
      ) : null}
      {origin && (
        <div className={styles.txSource}>
          Initiate from Dapp:{' '}
          <TransactionWebsite origin={origin} className={styles.txSourceLink} />
        </div>
      )}
    </div>
  );
};
