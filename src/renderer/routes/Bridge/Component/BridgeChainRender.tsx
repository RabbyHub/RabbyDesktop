import ChainIcon from '@/renderer/components/ChainIcon';
import { findChain } from '@/renderer/utils/chain';
import IconArrowDown from '@/../assets/icons/swap/arrow-down.svg?rc';

import clsx from 'clsx';
import { InsHTMLAttributes } from 'react';
import styled from 'styled-components';

const ChainWrapper = styled.div`
  height: 34px;
  border-radius: 6px;
  background: var(--r-neutral-card2, rgba(255, 255, 255, 0.06));
  padding: 8px;
  width: 100%;
  display: flex;
  align-items: center;
  border: 1px solid transparent;
  &:hover {
    background: linear-gradient(
        0deg,
        rgba(134, 151, 255, 0.3),
        rgba(134, 151, 255, 0.3)
      ),
      rgba(0, 0, 0, 0.3);
    border-color: rgba(255, 255, 255, 0.2);
  }
  & > {
    .logo {
      width: 18px;
      height: 18px;
      padding: 0;
      margin: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-right: 6px;
    }

    .name {
      color: var(--r-neutral-title1, #f7fafc);
      font-size: 14px;
      font-style: normal;
      font-weight: 500;
      line-height: normal;
      margin-right: 4px;
    }
  }
`;

export const BridgeChainRender = ({
  chain,
  titleClassName,
  ...other
}: {
  chain?: CHAINS_ENUM;
  titleClassName?: string;
} & InsHTMLAttributes<HTMLDivElement>) => {
  return (
    <ChainWrapper {...other}>
      {!!chain && (
        <ChainIcon
          chain={chain}
          className="logo"
          showCustomRPCToolTip
          isShowCustomRPC
        />
      )}
      <span className={clsx('name', titleClassName)}>
        {findChain({ enum: chain })?.name || 'Select'}
      </span>
      <IconArrowDown
        width={14}
        height={14}
        color="var(--r-neutral-title2, #FFF)"
        className="ml-auto"
      />
    </ChainWrapper>
  );
};
