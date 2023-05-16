import { useCustomRPC } from '@/renderer/hooks/useCustomRPC';
import { CHAINS, CHAINS_ENUM } from '@debank/common';
import { Tooltip } from 'antd';
import clsx from 'clsx';
import { useEffect, useMemo, useRef } from 'react';
import styled from 'styled-components';
import { useGhostTooltip } from '@/renderer/routes-popup/TopGhostWindow/useGhostWindow';

const ChainIconWrapper = styled.div`
  position: relative;
`;

const ChainIconEle = styled.img`
  border-radius: 100%;
  width: 32px;
  height: 32px;
  overflow: hidden;
  &.small {
    width: 20px;
    height: 20px;
  }
`;

const AvaliableIcon = styled.div`
  position: absolute;
  right: -2px;
  top: -2px;
  width: 10px;
  height: 10px;
  border: 1px solid #ffffff;
  background: #27c193;
  border-radius: 100%;
  overflow: hidden;
  &.small {
    width: 8px;
    height: 8px;
  }
`;

const UnavaliableIcon = styled.div`
  position: absolute;
  right: -2px;
  top: -2px;
  width: 10px;
  height: 10px;
  border: 1px solid #ffffff;
  background: #ec5151;
  border-radius: 100%;
  overflow: hidden;
  &.small {
    width: 8px;
    height: 8px;
  }
`;

const TooltipContent = styled.div`
  display: flex;
  align-items: center;
  max-width: 280px;
  span {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    flex: 1;
  }
  .alert-icon {
    width: 6px;
    height: 6px;
    border-radius: 100%;
    margin-right: 5px;
  }
  &.avaliable {
    color: #27c193;
    .alert-icon {
      background-color: #27c193;
    }
  }
  &.unavaliable {
    color: #ec5151;
    .alert-icon {
      background-color: #ec5151;
    }
  }
`;

interface Props {
  chain: CHAINS_ENUM;
  isShowCustomRPC?: boolean;
  size?: 'normal' | 'small';
  showCustomRPCToolTip?: boolean;
  nonce?: number;
  className?: string;
  isShowTooltipOnTop?: boolean;
}

const CustomRPCTooltipContent = ({
  rpc,
  avaliable,
}: {
  rpc: string;
  avaliable: boolean;
}) => {
  return (
    <TooltipContent className={clsx({ avaliable, unavaliable: !avaliable })}>
      <div className="alert-icon" />
      <span>
        RPC {avaliable ? 'avaliable' : 'unavailable'}: {rpc}
      </span>
    </TooltipContent>
  );
};

const ChainIcon = ({
  chain,
  isShowCustomRPC = false,
  size = 'normal',
  showCustomRPCToolTip = false,
  nonce,
  className,
  isShowTooltipOnTop = false,
}: Props) => {
  const {
    data: customRPC,
    status: customRPCStatus,
    pingCustomRPC,
  } = useCustomRPC();
  const currentRPC = useMemo(() => {
    const current = customRPC[chain];
    const status = customRPCStatus[chain];
    if (!isShowCustomRPC) {
      return null;
    }
    if (!current?.enable) {
      return null;
    }

    return {
      ...current,
      status,
    };
  }, [chain, customRPC, customRPCStatus, isShowCustomRPC]);

  const [{ showTooltip, hideTooltip }] = useGhostTooltip({
    mode: 'controlled',
    defaultTooltipProps: {
      title: 'You should never see this tooltip',
      placement: 'bottom',
    },
  });

  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (isShowCustomRPC) {
      pingCustomRPC(chain);
    }
  }, [chain, isShowCustomRPC, nonce, pingCustomRPC]);

  return (
    <Tooltip
      placement="topLeft"
      overlayClassName={clsx('rectangle')}
      arrowPointAtCenter
      align={{
        offset: [-15, 0],
      }}
      overlayInnerStyle={{
        padding: 10,
      }}
      title={
        currentRPC &&
        currentRPC?.status !== 'pending' &&
        showCustomRPCToolTip &&
        !isShowTooltipOnTop ? (
          <CustomRPCTooltipContent
            rpc={currentRPC?.url || ''}
            avaliable={currentRPC?.status === 'avaliable'}
          />
        ) : null
      }
    >
      <ChainIconWrapper
        className={clsx('chain-icon-comp', className)}
        ref={ref}
        onMouseEnter={(e) => {
          if (!ref.current) {
            return;
          }
          if (
            isShowTooltipOnTop &&
            showCustomRPCToolTip &&
            currentRPC &&
            currentRPC?.status !== 'pending'
          ) {
            showTooltip(ref.current, {
              title: `RPC ${
                currentRPC?.status === 'avaliable' ? 'avaliable' : 'unavailable'
              }: ${currentRPC?.url}`,
              placement: 'bottomLeft',
              overlayClassName: clsx(
                'custom-rpc-tooltip',
                currentRPC?.status === 'avaliable' ? 'avaliable' : 'unavaliable'
              ),
              align: {
                offset: [-6, -12],
              },
            });
          }
        }}
        onMouseLeave={() => {
          hideTooltip();
        }}
      >
        <ChainIconEle className={clsx(size)} src={CHAINS[chain].logo} />
        {currentRPC?.status === 'avaliable' && (
          <AvaliableIcon className={clsx(size)} />
        )}
        {currentRPC?.status === 'unavaliable' && (
          <UnavaliableIcon className={clsx(size)} />
        )}
      </ChainIconWrapper>
    </Tooltip>
  );
};

export default ChainIcon;
