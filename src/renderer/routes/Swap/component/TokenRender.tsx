import TokenWithChain from '@/renderer/components/TokenWithChain';
import IconRcArrowDownTriangle from '@/../assets/icons/swap/arrow-caret-down2.svg?rc';
import IconRcArrowDown from '@/../assets/icons/swap/arrow-down.svg?rc';

import styled from 'styled-components';
import { getTokenSymbol } from '@/renderer/utils';
import { TokenItem } from '@rabby-wallet/rabby-api/dist/types';
import { useTranslation } from 'react-i18next';

const TokenRenderWrapper = styled.div`
  width: 212px;
  height: 64px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 6px;
  display: flex;
  align-items: center;
  padding: 0 16px;
  font-size: 20px;
  font-weight: medium;
  color: #ffffff;
  border: 1px solid transparent;
  cursor: pointer;
  &:hover,
  &.bridge:hover {
    background: linear-gradient(
        0deg,
        rgba(134, 151, 255, 0.3),
        rgba(134, 151, 255, 0.3)
      ),
      rgba(0, 0, 0, 0.3);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 6px;
  }
  &.bridge {
    width: auto;
    max-width: 240px;
    height: 40px;
    border-radius: 8px;
    border-radius: 8px;
    background: var(--r-neutral-card2, rgba(255, 255, 255, 0.06));
    padding: 0 12px;

    .token {
      gap: 6px;
    }

    .select {
      gap: 6px;
    }
  }
  .token {
    display: flex;
    flex: 1;
    gap: 12px;
    align-items: center;

    .text {
      max-width: 90px;
      display: inline-block;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
  }
  .select {
    flex: 1;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .arrow {
    margin-left: auto;
    width: 20px;
    height: 20px;
  }
`;
export const TokenRender = ({
  openTokenModal,
  token,
  type = 'swap',
}: {
  token?: TokenItem;
  openTokenModal: () => void;
  type?: 'swap' | 'bridge';
}) => {
  const { t } = useTranslation();
  const isBridge = type === 'bridge';

  return (
    <TokenRenderWrapper className={type} onClick={openTokenModal}>
      {token ? (
        <div className="token">
          <TokenWithChain
            width={isBridge ? '24px' : '32px'}
            height={isBridge ? '24px' : '32px'}
            token={token}
            hideConer
            hideChainIcon
          />
          <span className="text" title={getTokenSymbol(token)}>
            {getTokenSymbol(token)}
          </span>
          {isBridge ? (
            <IconRcArrowDown className="arrow" />
          ) : (
            <IconRcArrowDownTriangle className="arrow" />
          )}
        </div>
      ) : (
        <div className="select">
          <span className="whitespace-nowrap">
            {t('page.swap.select-token')}
          </span>
          {isBridge ? (
            <IconRcArrowDown className="arrow" />
          ) : (
            <IconRcArrowDownTriangle className="arrow" />
          )}
        </div>
      )}
    </TokenRenderWrapper>
  );
};
