import { walletOpenapi } from '@/renderer/ipcRequest/rabbyx';
import { INTERNAL_REQUEST_ORIGIN } from '@/renderer/utils/constant';
import { sinceTime } from '@/renderer/utils/time';
import { parseAction } from '@rabby-wallet/rabby-action';
import { SafeMessage } from '@safe-global/api-kit';
import { useRequest } from 'ahooks';
import { isString } from 'lodash';
import React from 'react';
import { getActionTypedDataTypeText, getActionTypeText } from '../util';

const IconUnknown = 'rabby-internal://assets/icons/queue/unknown.svg';
export interface Props {
  data: SafeMessage;
}

export const GnosisMessageExplain: React.FC<Props> = ({ data }) => {
  const { data: content, loading } = useRequest(
    async () => {
      if (isString(data.message)) {
        const res = await walletOpenapi.parseText({
          text: data.message,
          origin: INTERNAL_REQUEST_ORIGIN,
          address: data.safe,
        });

        const parsed = parseAction({
          type: 'text',
          data: res.action,
          text: data.message,
          sender: data.safe,
        });

        return getActionTypeText(parsed);
      }
      const res = await walletOpenapi.parseTypedData({
        typedData: data.message,
        origin: INTERNAL_REQUEST_ORIGIN,
        address: data.safe,
      });

      const parsed = parseAction({
        type: 'typed_data',
        data: res.action as any,
        typedData: data.message,
        sender: data.safe,
      });

      return getActionTypedDataTypeText(parsed);
    },
    {
      refreshDeps: [data.message, data.safe],
      cacheKey: `getActionTypeText-${data.message}-${data.safe}`,
      staleTime: 30 * 1000,
    }
  );

  const iconUrl = IconUnknown;

  const time = sinceTime(new Date(data.created).getTime() / 1000, 'YYYY/MM/DD');

  return (
    <div className="flex items-center m-0 flex-1 py-[32px] relative w-[365px]">
      <time className="text-[14px] opacity-60 absolute top-0">{time}</time>
      <img
        className="w-[30px] h-[30px] mr-[10px]"
        src={iconUrl || IconUnknown}
      />
      <span className="text-[15px] font-bold leading-[18px]">{content}</span>
    </div>
  );
};
