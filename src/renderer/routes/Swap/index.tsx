import styled from 'styled-components';
import { FixedBackHeader } from '@/renderer/components/FixedBackHeader';
import { useSwap } from '@/renderer/hooks/rabbyx/useSwap';
import clsx from 'clsx';
import { useCurrentAccount } from '@/renderer/hooks/rabbyx/useAccount';
import { SwapByDex } from './swap';

const SwapWrapper = styled.div`
  & > .header {
    position: absolute;
    left: 32px;
    top: 12px;
    display: flex;
    gap: 28px;
    align-items: center;
    font-weight: 500;
    font-size: 28px;
    color: #fff;

    & > svg {
      cursor: pointer;
    }
  }

  & > .content {
    width: 594px;
    margin: auto;
    margin-top: calc(70px - var(--mainwin-headerblock-offset));
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 8px;
  }
`;

export const Swap = () => {
  const { swap } = useSwap();
  const lastSelectedDex = swap.selectedDex;
  const { currentAccount } = useCurrentAccount();
  return (
    <SwapWrapper>
      <FixedBackHeader>Swap</FixedBackHeader>

      <div className={clsx(lastSelectedDex && 'content')}>
        <SwapByDex key={`${currentAccount?.address}`} />
      </div>
    </SwapWrapper>
  );
};
