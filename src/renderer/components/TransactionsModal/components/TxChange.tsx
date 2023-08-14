import NFTAvatar from '@/renderer/components/NFTAvatar';
import { numberWithCommasIsLtOne } from '@/renderer/utils/number';
import { getTokenSymbol } from '@/renderer/utils';
import {
  NFTItem,
  TokenItem,
  TxDisplayItem,
  TxHistoryItem,
} from '@rabby-wallet/rabby-api/dist/types';
import classNames from 'classnames';
import clsx from 'clsx';
import { useState } from 'react';
import styles from '../index.module.less';
// eslint-disable-next-line import/no-cycle
import { useTokenAction } from '../../TokenActionModal/TokenActionModal';
import ModalPreviewNFTItem from '../../ModalPreviewNFTItem';

const IconUnknown = 'rabby-internal://assets/icons/common/token-default.svg';

type TxChangeProps = {
  data: TxDisplayItem | TxHistoryItem;
} & Pick<TxDisplayItem, 'tokenDict'>;

export const TxChange = ({ data: info, tokenDict }: TxChangeProps) => {
  const tokens = tokenDict || {};
  const { setTokenAction, cancelTokenAction } = useTokenAction();
  const [nft, setNft] = useState<NFTItem | undefined>(undefined);

  const handleClick = async (token: TokenItem, isNft: boolean) => {
    console.log(token);
    if (isNft) {
      setNft(token as any);
      return;
    }

    cancelTokenAction();
    setTimeout(() => {
      setTokenAction(token);
    }, 0);
  };

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
              <span
                onClick={() => handleClick(token, isNft)}
                className={clsx(
                  styles.txChangeSymbol,
                  'underline cursor-pointer ml-[4px]'
                )}
              >
                {name}
              </span>
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
              <span
                onClick={() => handleClick(token, isNft)}
                className={clsx(
                  styles.txChangeSymbol,
                  'underline cursor-pointer ml-[4px]'
                )}
              >
                {name}
              </span>
            </span>
          </div>
        );
      })}
      <ModalPreviewNFTItem
        onSend={() => {
          setNft(undefined);
          cancelTokenAction();
        }}
        nft={nft}
        onCancel={() => setNft(undefined)}
      />
    </div>
  );
};
