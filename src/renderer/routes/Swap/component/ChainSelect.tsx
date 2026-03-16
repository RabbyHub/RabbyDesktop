import { CHAINS_ENUM } from '@debank/common';
import { InsHTMLAttributes, useCallback, useState } from 'react';

import IconRcSwapArrowDownTriangle from '@/../assets/icons/swap/arrow-caret-down2.svg?rc';
import IconArrowDown from '@/../assets/icons/swap/arrow-down.svg?rc';

import ChainIcon from '@/renderer/components/ChainIcon';
import { findChain } from '@/renderer/utils/chain';
import styled from 'styled-components';
import { SwitchChainModalNoZPopup } from '@/renderer/components/SwitchChainModal';

const ChainSelectWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;

  .logo {
    width: 24px;
    height: 24px;
    border-radius: 2px;
    /* overflow: hidden; */

    img {
      width: 100%;
      height: 100%;
    }
  }

  .name {
    font-weight: 500;
    font-size: 16px;
    color: var(--r-neutral-title2, #fff);
  }
`;

interface ChainSelectorProps {
  className?: string;
  value: CHAINS_ENUM;
  onChange?(value: CHAINS_ENUM): void;
  readonly?: boolean;
  disabledTips?: string;
  title?: string;
  supportChains?: CHAINS_ENUM[];
  chainRender?: ((chian: CHAINS_ENUM) => React.ReactNode) | React.ReactNode;
  hideTestnetTab?: boolean;
  excludeChains?: CHAINS_ENUM[];
}
export const ChainSelect = ({
  className,
  value,
  onChange,
  readonly = false,
  disabledTips,
  title,
  supportChains,
  chainRender,
  hideTestnetTab = false,
  excludeChains,
}: React.PropsWithoutRef<ChainSelectorProps>) => {
  const [open, setOpen] = useState(false);

  const handleChange = useCallback(
    (v: CHAINS_ENUM) => {
      if (readonly) return;
      if (onChange) {
        onChange(v);
        setOpen(false);
      }
    },
    [readonly, onChange]
  );

  const openChainModal = useCallback(() => {
    setOpen(true);
  }, []);

  const handleClickSelector = () => {
    if (readonly) return;
    openChainModal();
  };

  return (
    <>
      <SwitchChainModalNoZPopup
        open={open}
        onCancel={() => setOpen(false)}
        onChange={handleChange}
        value={value}
        title={title}
        disabledTips={disabledTips}
        supportChains={supportChains}
        hideTestnetTab={hideTestnetTab}
        isCheckCustomRPC
        excludeChains={excludeChains}
      />
      <ChainSelectWrapper className={className} onClick={handleClickSelector}>
        {chainRender ? (
          typeof chainRender === 'function' ? (
            chainRender?.(value)
          ) : (
            chainRender
          )
        ) : (
          <>
            <ChainIcon
              chain={value}
              className="logo"
              showCustomRPCToolTip
              isShowCustomRPC
            />
            <span className="name">{findChain({ enum: value })?.name}</span>
            {!readonly && (
              <IconRcSwapArrowDownTriangle
                className="arrow"
                width={20}
                height={20}
              />
            )}
          </>
        )}
      </ChainSelectWrapper>
    </>
  );
};

const ChainWrapper = styled.div`
  height: 48px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 6px;
  padding: 12px 16px;
  width: 100%;
  display: flex;
  align-items: center;
  gap: 12px;
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
      width: 24px;
      height: 24px;
    }
    .down {
      margin-left: auto;
      width: 20px;
      height: 20px;
    }
  }
`;

export const ChainRender = ({
  chain,
  ...other
}: { chain: CHAINS_ENUM } & InsHTMLAttributes<HTMLDivElement>) => {
  return (
    <ChainWrapper {...other}>
      <ChainIcon
        chain={chain}
        className="logo"
        showCustomRPCToolTip
        isShowCustomRPC
      />
      <span className="name">{findChain({ enum: chain })?.name}</span>
      {/* <img className="down" src={ImgArrowDown} alt="" /> */}
      <IconArrowDown
        width={20}
        height={20}
        color="var(--r-neutral-title2, #FFF)"
        className="ml-auto"
      />
    </ChainWrapper>
  );
};
