/* eslint-disable @typescript-eslint/no-shadow */
import React from 'react';

import { TransactionHistoryItem } from '@/isomorphic/types/rabbyx';
import { isSameAddress } from '@/renderer/utils/address';
import { splitNumberByStep } from '@/renderer/utils/number';
import { ExplainTxResponse } from '@rabby-wallet/rabby-api/dist/types';

const IconUnknown = 'rabby-internal://assets/icons/transaction/tx-unknown.svg';

const IconUser = 'rabby-internal://assets/icons/transaction/tx-send.svg';

export const TransactionExplain = ({
  isFailed,
  isSubmitFailed,
  isWithdrawed,
  isCancel,
  explain,
  onOpenScan,
}: {
  isFailed: boolean;
  isSubmitFailed: boolean;
  isWithdrawed: boolean;
  isCancel: boolean;
  explain: ExplainTxResponse;
  onOpenScan(): void;
}) => {
  let icon: React.ReactNode = (
    <img className="icon icon-explain" src={IconUnknown} />
  );
  let content: string | React.ReactNode = 'Unknown Transaction';
  if (explain) {
    if (explain.type_cancel_nft_collection_approval) {
      icon = (
        <img
          src={
            explain.type_cancel_nft_collection_approval
              .spender_protocol_logo_url || IconUnknown
          }
          className="icon icon-explain"
        />
      );
      content = (
        <>
          Cancel NFT Collection Approval for{' '}
          {explain.type_cancel_nft_collection_approval.spender_protocol_name ||
            'Unknown protocol'}
        </>
      );
    } else if (explain.type_nft_collection_approval) {
      icon = (
        <img
          src={
            explain.type_nft_collection_approval.spender_protocol_logo_url ||
            IconUnknown
          }
          className="icon icon-explain"
        />
      );
      content = (
        <>
          NFT Collection Approval for{' '}
          {explain.type_nft_collection_approval.spender_protocol_name ||
            'Unknown protocol'}
        </>
      );
    } else if (explain.type_cancel_single_nft_approval) {
      icon = (
        <img
          src={
            explain.type_cancel_single_nft_approval.spender_protocol_logo_url ||
            IconUnknown
          }
          className="icon icon-explain"
        />
      );
      content = (
        <>
          Cancel Single NFT Approval for{' '}
          {explain.type_cancel_single_nft_approval.spender_protocol_name ||
            'Unknown protocol'}
        </>
      );
    } else if (explain.type_single_nft_approval) {
      icon = (
        <img
          src={
            explain.type_single_nft_approval.spender_protocol_logo_url ||
            IconUnknown
          }
          className="icon icon-explain"
        />
      );
      content = (
        <>
          Single NFT Approval for{' '}
          {explain.type_single_nft_approval.spender_protocol_name ||
            'Unknown protocol'}
        </>
      );
    } else if (explain.type_nft_send) {
      icon = <img className="icon icon-explain" src={IconUser} />;
      content = `Send ${splitNumberByStep(
        explain.type_nft_send.token_amount
      )} NFT`;
    } else if (explain.type_cancel_token_approval) {
      icon = (
        <img
          src={
            explain.type_cancel_token_approval.spender_protocol_logo_url ||
            IconUnknown
          }
          className="icon icon-explain"
        />
      );
      content = (
        <>
          Cancel {explain.type_cancel_token_approval.token_symbol} Approve for{' '}
          {explain.type_cancel_token_approval.spender_protocol_name ||
            'Unknown protocol'}
        </>
      );
    } else if (explain.type_token_approval) {
      icon = (
        <img
          src={
            explain.type_token_approval.spender_protocol_logo_url || IconUnknown
          }
          className="icon icon-explain"
        />
      );
      content = (
        <>
          Approve {explain.type_token_approval.token_symbol}{' '}
          {explain.type_token_approval.is_infinity
            ? 'unlimited'
            : splitNumberByStep(explain.type_token_approval.token_amount)}{' '}
          for{' '}
          {explain.type_token_approval.spender_protocol_name ||
            'Unknown protocol'}
        </>
      );
    } else if (explain.type_send) {
      icon = <img className="icon icon-explain" src={IconUser} />;
      content = (
        <>
          Send {splitNumberByStep(explain.type_send.token_amount)}{' '}
          {explain.type_send.token_symbol}
        </>
      );
    } else if (explain.type_call) {
      icon = (
        <img
          src={explain.type_call.contract_protocol_logo_url || IconUnknown}
          className="icon icon-explain"
        />
      );
      content = explain.type_call.action;
    }
  }

  return (
    <div className="tx-explain" onClick={onOpenScan}>
      {icon || <img className="icon icon-explain" src={IconUnknown} />}
      <div className="flex flex-1 justify-between">
        <div className="flex flex-1 items-center tx-explain__text">
          <span>{content || 'Unknown Transaction'}</span>
          {/* <SvgIconOpenExternal className="icon icon-external" /> */}
        </div>
        <span className="text-red-light text-14 font-normal text-right">
          {isCancel && 'Canceled'}
          {isFailed && 'Failed'}
          {isSubmitFailed && !isWithdrawed && 'Failed to submit'}
          {isWithdrawed && 'Quick cancel'}
        </span>
      </div>
    </div>
  );
};
