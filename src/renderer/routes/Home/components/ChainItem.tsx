import { DisplayChainWithWhiteLogo } from '@/renderer/utils/chain';
import { formatUsdValue } from '@/renderer/utils/number';
import clsx from 'clsx';
import React from 'react';

export interface Chain extends DisplayChainWithWhiteLogo {
  usd_value: number;
}

export interface Props {
  data: Chain;
  selectChainServerId: string | null;
  handleSelectChain: (serverId: string) => void;
  percentMap: Record<string, string>;
}

export const ChainItem: React.FC<Props> = ({
  data,
  selectChainServerId,
  handleSelectChain,
  percentMap,
}) => {
  return (
    <div
      id={`chain-icon-${data.id}`}
      className={clsx('flex space-x-[9px]', 'cursor-pointer', {
        selected: data.id === selectChainServerId,
        'opacity-30':
          selectChainServerId !== null && data.id !== selectChainServerId,
      })}
      onClick={() => handleSelectChain(data.id)}
    >
      <img
        className="w-[32px] h-[32px] rounded-[4px]"
        src={data.logo || data.logo_url}
      />
      <div className="flex flex-col space-y-[5px] hover:text-[#8697FF]">
        <span className="text-[12px] opacity-70">{data.name}</span>
        <div className="text-[14px]">
          <span>{formatUsdValue(data.usd_value)}</span>
          <span className="text-[12px] opacity-70 ml-[8px]">
            {percentMap[data.id]}%
          </span>
        </div>
      </div>
    </div>
  );
};
