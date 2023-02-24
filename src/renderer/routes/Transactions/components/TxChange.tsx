import NFTAvatar from '@/renderer/components/NFTAvatar';
import { numberWithCommasIsLtOne } from '@/renderer/utils/number';
import {
  TokenItem,
  TxDisplayItem,
  TxHistoryItem,
} from '@debank/rabby-api/dist/types';
import classNames from 'classnames';
import styles from '../index.module.less';

const IconUnknown = 'rabby-internal://assets/icons/common/token-default.svg';

export function getTokenSymbol(token: TokenItem) {
  return (
    token?.symbol || token?.optimized_symbol || token?.display_symbol || ''
  );
}

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
            className="token-change-item"
            title={name}
            data-id={v.token_id}
            data-name={name}
            key={v.token_id}
          >
            {isNft ? (
              <NFTAvatar
                className="token-icon"
                thumbnail
                content={token?.content}
                type={token?.content_type}
              />
            ) : (
              <img
                className="token-icon"
                src={token?.logo_url || IconUnknown}
                alt=""
              />
            )}

            <span className="token-change-item-text">
              -{' '}
              {`${
                isNft ? v.amount : numberWithCommasIsLtOne(v.amount, 2)
              } ${name}`}
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
            className="token-change-item is-success"
            title={name}
            key={v.token_id}
          >
            {isNft ? (
              <NFTAvatar
                className="token-icon"
                thumbnail
                content={token?.content}
                type={token?.content_type}
              />
            ) : (
              <img
                className="token-icon"
                src={token?.logo_url || IconUnknown}
                alt=""
              />
            )}

            <span className="token-change-item-text">
              +{' '}
              {`${
                isNft ? v.amount : numberWithCommasIsLtOne(v.amount, 2)
              } ${name}`}
            </span>
          </div>
        );
      })}
    </div>
  );
};
