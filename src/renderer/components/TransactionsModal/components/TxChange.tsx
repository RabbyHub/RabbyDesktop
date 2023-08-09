import NFTAvatar from '@/renderer/components/NFTAvatar';
import { numberWithCommasIsLtOne } from '@/renderer/utils/number';
import { getTokenSymbol } from '@/renderer/utils';
import {
  TxDisplayItem,
  TxHistoryItem,
} from '@rabby-wallet/rabby-api/dist/types';
import classNames from 'classnames';
import clsx from 'clsx';
import styles from '../index.module.less';

const IconUnknown = 'rabby-internal://assets/icons/common/token-default.svg';

type TxChangeProps = {
  data: TxDisplayItem | TxHistoryItem;
} & Pick<TxDisplayItem, 'tokenDict'>;

export const TxChange = ({ data: info, tokenDict }: TxChangeProps) => {
  const tokens = tokenDict || {};

  if (!info.sends?.length && !info.receives?.length) {
    return null;
  }

  return (
    <div className={classNames(styles.txChange, styles.colTxChange)}>
      {info.sends?.map((v) => {
        const token = tokens[v.token_id];
        const isNft = v.token_id?.length === 32;
        const symbol = getTokenSymbol(token);
        const name = isNft
          ? token?.name ||
            (symbol ? `${symbol} ${token?.inner_id}` : 'Unknown NFT')
          : symbol;

        return (
          <div
            className={clsx('token-change-item', styles.txChangeItem)}
            title={`${
              isNft ? v.amount : numberWithCommasIsLtOne(v.amount, 2)
            } ${name}`}
            data-id={v.token_id}
            data-name={name}
            key={v.token_id}
          >
            {isNft ? (
              <NFTAvatar
                className={clsx('token-icon', styles.txChangeIcon)}
                thumbnail
                content={token?.content}
                type={token?.content_type}
              />
            ) : (
              <img
                className={clsx('token-icon', styles.txChangeIcon)}
                src={token?.logo_url || IconUnknown}
                alt=""
              />
            )}

            <span
              className={clsx('token-change-item-text', styles.txChangeText)}
            >
              - {`${isNft ? v.amount : numberWithCommasIsLtOne(v.amount, 2)}`}
              <span className={styles.txChangeSymbol}>{name}</span>
            </span>
          </div>
        );
      })}
      {info.receives?.map((v) => {
        const token = tokens[v.token_id];
        const isNft = v.token_id?.length === 32;
        const symbol = getTokenSymbol(token);
        const name = isNft
          ? token?.name ||
            (symbol ? `${symbol} ${token?.inner_id}` : 'Unknown NFT')
          : symbol;

        return (
          <div
            data-id={v.token_id}
            data-name={name}
            className={clsx(
              'token-change-item is-success',
              styles.txChangeItem,
              styles.txChangeItemSuccess
            )}
            title={`${
              isNft ? v.amount : numberWithCommasIsLtOne(v.amount, 2)
            } ${name}`}
            key={v.token_id}
          >
            {isNft ? (
              <NFTAvatar
                className={clsx('token-icon', styles.txChangeIcon)}
                thumbnail
                content={token?.content}
                type={token?.content_type}
              />
            ) : (
              <img
                className={clsx('token-icon', styles.txChangeIcon)}
                src={token?.logo_url || IconUnknown}
                alt=""
              />
            )}

            <span
              className={clsx('token-change-item-text', styles.txChangeText)}
            >
              + {`${isNft ? v.amount : numberWithCommasIsLtOne(v.amount, 2)}`}
              <span className={styles.txChangeSymbol}>{name}</span>
            </span>
          </div>
        );
      })}
    </div>
  );
};
