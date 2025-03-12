import { splitNumberByStep } from '@/renderer/utils/number';
import {
  ApproveAction,
  ExplainTxResponse,
  ParseTxResponse,
  RevokeTokenApproveAction,
  SendAction,
} from '@rabby-wallet/rabby-api/dist/types';
import { Trans, useTranslation } from 'react-i18next';
import React, { useMemo } from 'react';
import { walletOpenapi } from '@/renderer/ipcRequest/rabbyx';
import { useRequest } from 'ahooks';
import { getProtocol } from '@rabby-wallet/rabby-action';
import { getTokenSymbol } from '@/renderer/utils';

const IconUnknown = 'rabby-internal://assets/icons/queue/unknown.svg';
const IconUser = 'rabby-internal://assets/icons/queue/user.svg';
export interface Props {
  explain: ParseTxResponse;
  serverId: string;
}

export const TxItemExplain: React.FC<Props> = ({ explain, serverId }) => {
  const { t } = useTranslation();
  const { data: spenderProtocol } = useRequest(async () => {
    if (explain?.action?.data && 'spender' in explain.action.data) {
      const { desc } = await walletOpenapi.addrDesc(
        explain?.action?.data?.spender
      );
      return getProtocol(desc.protocol, serverId);
    }
  });

  const { data: contractProtocol } = useRequest(async () => {
    if (
      explain?.action?.data &&
      !('spender' in (explain?.action?.data || {})) &&
      explain?.contract_call?.contract?.id
    ) {
      const { desc } = await walletOpenapi.addrDesc(
        explain?.contract_call?.contract?.id
      );
      return getProtocol(desc.protocol, serverId);
    }
  });

  const { iconUrl, content } = useMemo(() => {
    // eslint-disable-next-line @typescript-eslint/no-shadow
    let iconUrl: string | undefined = '';
    // eslint-disable-next-line @typescript-eslint/no-shadow
    let content: string | React.ReactNode = t('page.safeQueue.unknownTx');

    if (explain) {
      if (explain?.action?.type === 'revoke_token') {
        const data = explain.action.data as RevokeTokenApproveAction;
        iconUrl = spenderProtocol?.logo_url;
        content = (
          <Trans
            i18nKey="page.safeQueue.cancelExplain"
            values={{
              token: getTokenSymbol(data.token),
              protocol:
                spenderProtocol?.name || t('page.safeQueue.unknownProtocol'),
            }}
          />
        );
      } else if (explain?.action?.type === 'approve_token') {
        const data = explain.action.data as ApproveAction;
        iconUrl = spenderProtocol?.logo_url;
        content = (
          <Trans
            i18nKey="page.safeQueue.approvalExplain"
            values={{
              token: getTokenSymbol(data.token),
              count:
                data.token.amount < 1e9
                  ? splitNumberByStep(data.token.amount)
                  : t('page.safeQueue.unlimited'),
              protocol:
                spenderProtocol?.name || t('page.safeQueue.unknownProtocol'),
            }}
          />
        );
      } else if (explain?.action?.type === 'send_token') {
        const data = explain.action.data as SendAction;
        iconUrl = IconUser;
        content = `${t('page.safeQueue.action.send')} ${splitNumberByStep(
          data.token.amount
        )} ${getTokenSymbol(data.token)}`;
      } else if (explain?.action?.type === 'cancel_tx') {
        content = t('page.safeQueue.action.cancel');
      } else if (explain?.contract_call) {
        iconUrl = contractProtocol?.logo_url;
        content = explain.contract_call.func;
      }
    }
    return {
      iconUrl,
      content,
    };
  }, [
    contractProtocol?.logo_url,
    explain,
    spenderProtocol?.logo_url,
    spenderProtocol?.name,
    t,
  ]);

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
