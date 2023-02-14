import { Tooltip } from 'antd';
import IconQuestion from '@/../assets/icons/swap/question-outline.svg?rc';
import IconInfo from '@/../assets/icons/swap/info-outline.svg?rc';
import styled from 'styled-components';

const feeTips = {
  '0.3': () => '0.3% fee for common token',
  '0.1': () => '0.1% fee for stablecoins',
  '0': (symbol: string) =>
    `0 fee to wrap/unwrap tokens by interacting directly with ${symbol} contracts.`,
};

const SectionStyled = styled.section`
  color: #ffffff;
  display: flex;
  justify-content: space-between;

  .left {
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .tooltip1 {
    .ant-tooltip-arrow {
      left: 100px;
    }
    .ant-tooltip-inner {
      width: var(--swap-content-w);
      transform: translateX(10px);
      font-size: 12;
    }
  }

  .tooltip2 {
    .ant-tooltip-arrow {
      left: 124px;
    }
    .ant-tooltip-inner {
      max-width: var(--swap-content-w);
      font-size: 12;
    }
  }
  .title {
    font-weight: 400;
    font-size: 14px;
    line-height: 14px;
  }

  .feeBox {
    text-align: right;
    font-weight: 500;
    font-size: 13px;
    line-height: 15px;
    display: flex;
    align-items: center;

    .fee {
      font-weight: 500;
      font-size: 14px;
      margin-right: 4px;
    }
  }

  .input {
    cursor: pointer;
  }
`;

export interface FeeProps {
  fee: '0.3' | '0.1' | '0';
  symbol?: string;
}
export const Fee = (props: FeeProps) => {
  const { fee, symbol = '' } = props;

  return (
    <SectionStyled>
      <div className="left">
        <div className="title">Rabby fee</div>
        <Tooltip
          placement="top"
          overlayClassName="tooltip1"
          title={
            "The charged fee depends on which token you're swapping. It has been charged from the current quote."
          }
          getPopupContainer={(e) => e.parentElement || document.body}
        >
          <IconInfo />
        </Tooltip>
      </div>
      <div className="feeBox">
        <span className="fee">{fee}%</span>
        <Tooltip
          overlayClassName="tooltip2"
          getPopupContainer={(e) => e.parentElement || document.body}
          placement="top"
          title={feeTips[fee](symbol)}
        >
          <IconQuestion />
        </Tooltip>
      </div>
    </SectionStyled>
  );
};
