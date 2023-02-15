import { useMemo, useCallback } from 'react';
import { CHAINS, CHAINS_ENUM } from '@debank/common';
import { useSwap } from '@/renderer/hooks/rabbyx/useSwap';
import { DEX_SUPPORT_CHAINS } from '@rabby-wallet/rabby-swap';

import IconRcSwapArrowDownTriangle from '@/../assets/icons/swap/arrow-caret-down2.svg?rc';

import styled from 'styled-components';
import { useSwitchChainModal } from '@/renderer/hooks/useSwitchChainModal';

const ChainSelectWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;

  .logo {
    width: 23px;
    height: 23px;
    border-radius: 2px;
    overflow: hidden;
  }

  .name {
    font-weight: 500;
    font-size: 16px;
    color: #ffffff;
  }
`;

interface ChainSelectorProps {
  value: CHAINS_ENUM;
  onChange?(value: CHAINS_ENUM): void;
  readonly?: boolean;
  disabledTips?: string;
  title?: string;
}
export const ChainSelect = ({
  value,
  onChange,
  readonly = false,
  disabledTips,
  title,
}: ChainSelectorProps) => {
  const {
    swap: { selectedDex },
  } = useSwap();

  const supportChains = useMemo(
    () =>
      DEX_SUPPORT_CHAINS[
        selectedDex as unknown as keyof typeof DEX_SUPPORT_CHAINS
      ] || [],
    [selectedDex]
  );
  const handleChange = (v: CHAINS_ENUM) => {
    if (readonly) return;
    if (onChange) {
      onChange(v);
    }
  };

  const { open } = useSwitchChainModal(handleChange, false);

  const openChainModal = useCallback(() => {
    open({
      value,
      title,
      disabledTips,
      supportChains,
    });
  }, [disabledTips, open, supportChains, title, value]);
  const handleClickSelector = () => {
    if (readonly) return;
    openChainModal();
  };

  if (!selectedDex) {
    return null;
  }

  return (
    <>
      <ChainSelectWrapper onClick={handleClickSelector}>
        <img src={CHAINS[value].logo} className="logo" />
        <span className="name">{CHAINS[value].name}</span>
        {!readonly && (
          <IconRcSwapArrowDownTriangle
            className="arrow"
            width={10}
            height={6}
          />
        )}
      </ChainSelectWrapper>
    </>
  );
};
