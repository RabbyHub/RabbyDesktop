import { splitNumberByStep } from '@/renderer/utils/number';
import { ExplainTxResponse } from '@debank/rabby-api/dist/types';
import React from 'react';

const IconUnknown = 'rabby-internal://assets/icons/queue/unknown.svg';
const IconUser = 'rabby-internal://assets/icons/queue/user.svg';
export interface Props {
  explain: ExplainTxResponse;
}

export const TxItemExplain: React.FC<Props> = ({ explain }) => {
  let iconUrl = '';
  let content = 'Unknown Transaction';

  if (explain) {
    if (explain.type_cancel_token_approval) {
      iconUrl = explain.type_cancel_token_approval.spender_protocol_logo_url;
      content = `Cancel ${
        explain.type_cancel_token_approval.token_symbol
      } Approve for ${
        explain.type_cancel_token_approval.spender_protocol_name ||
        'UnknownProtocol'
      }`;
    }
    if (explain.type_token_approval) {
      iconUrl = explain.type_token_approval.spender_protocol_logo_url;
      content = `Approve ${
        explain.type_token_approval.is_infinity
          ? 'unlimited'
          : splitNumberByStep(explain.type_token_approval.token_amount)
      } ${explain.type_token_approval.token_symbol} for ${
        explain.type_token_approval.spender_protocol_name || 'UnknownProtocol'
      }`;
    }
    if (explain.type_send) {
      iconUrl = IconUser;
      content = `Send ${splitNumberByStep(explain.type_send.token_amount)} ${
        explain.type_send.token_symbol
      }`;
    }
    if (explain.type_call) {
      iconUrl = explain.type_call.contract_protocol_logo_url;
      content = explain.type_call.action;
    }
  }

  return (
    <p className="flex items-center m-0 flex-1">
      <img
        className="w-[30px] h-[30px] mr-[10px]"
        src={iconUrl || IconUnknown}
      />
      <span className="text-[15px] font-bold leading-[18px]">
        {content || 'Unknown Transaction'}
      </span>
    </p>
  );
};
