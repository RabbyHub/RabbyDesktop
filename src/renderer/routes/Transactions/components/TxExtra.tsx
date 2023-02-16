import { getChain } from '@/renderer/utils';
import { numberWithCommasIsLtOne } from '@/renderer/utils/number';
import { TxDisplayItem, TxHistoryItem } from '@debank/rabby-api/dist/types';
import classNames from 'classnames';
import styles from '../index.module.less';

interface TxExtraProps {
  data: TxDisplayItem | TxHistoryItem;
}

export const TxExtra = ({ data }: TxExtraProps) => {
  const chain = getChain(data.chain);
  return (
    <div className={classNames(styles.txExtra)}>
      {data.tx && data.tx?.eth_gas_fee ? (
        <div className={styles.txGas}>
          GasFee: {numberWithCommasIsLtOne(data.tx?.eth_gas_fee, 4)}{' '}
          {chain?.nativeTokenSymbol} ($
          {numberWithCommasIsLtOne(data.tx?.usd_gas_fee ?? 0, 2)})
        </div>
      ) : null}
      <div className={styles.txSource}>Initiate from Dapp:</div>
    </div>
  );
};
