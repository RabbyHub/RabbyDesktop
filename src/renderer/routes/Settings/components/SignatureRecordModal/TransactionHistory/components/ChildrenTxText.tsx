/* eslint-disable @typescript-eslint/no-shadow */
import styled from 'styled-components';

import { TransactionHistoryItem } from '@/isomorphic/types/rabbyx';
import { isSameAddress } from '@/renderer/utils/address';

export const ChildrenTxText = ({
  tx,
  originTx,
}: {
  tx: TransactionHistoryItem;
  originTx: TransactionHistoryItem;
}) => {
  const isOrigin = tx.hash === originTx.hash;
  const isCancel = isSameAddress(tx.rawTx.from, tx.rawTx.to);
  // const { t } = useTranslation();
  let text = '';

  if (isOrigin) {
    text = 'Initial tx';
  } else if (isCancel) {
    text = 'Cancel tx';
  } else {
    text = 'Speed up tx';
  }
  return <span className="tx-type">{text}</span>;
};
