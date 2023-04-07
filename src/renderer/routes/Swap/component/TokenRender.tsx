import TokenWithChain from '@/renderer/components/TokenWithChain';
import IconRcArrowDownTriangle from '@/../assets/icons/swap/arrow-caret-down2.svg?rc';
import styled from 'styled-components';
import { TokenAmountInputProps } from './TokenSelect';

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
  &:hover {
    background: linear-gradient(
        0deg,
        rgba(134, 151, 255, 0.3),
        rgba(134, 151, 255, 0.3)
      ),
      rgba(0, 0, 0, 0.3);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 6px;
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
    font-size: 12px;
    opacity: 0.8;
  }
`;
export const TokenRender: TokenAmountInputProps['tokenRender'] = ({
  openTokenModal,
  token,
}) => {
  return (
    <TokenRenderWrapper onClick={openTokenModal}>
      {token ? (
        <div className="token">
          <TokenWithChain
            width="32px"
            height="32px"
            token={token}
            hideConer
            hideChainIcon
          />
          <span className="text" title={token.symbol}>
            {token.symbol}
          </span>
          <IconRcArrowDownTriangle className="arrow" />
        </div>
      ) : (
        <div className="select">
          <span>Select Token</span>
          <IconRcArrowDownTriangle className="arrow" />
        </div>
      )}
    </TokenRenderWrapper>
  );
};
