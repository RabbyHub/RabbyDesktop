import { Tooltip } from 'antd';
import IconQuestion from '@/../assets/icons/swap/question-outline.svg?rc';
import IconInfo from '@/../assets/icons/swap/info-outline.svg?rc';
import styled from 'styled-components';

const feeTips = {
  '0.3': () =>
    'Enjoy fee-free transactions - 0.3% fee for common tokens is removed',
  '0.1': () =>
    'Enjoy fee-free transactions - 0.1% fee for stable coins is removed',
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

  .tooltip {
    .ant-tooltip-content .ant-tooltip-inner {
      font-size: 12;
      display: flex;
      align-items: center;
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
      text-decoration: line-through;
      color: rgba(255, 255, 255, 0.5);
    }

    .real-fee {
      color: #ffffff;
      margin-right: 4px;
      font-weight: 500;
      font-size: 14px;
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

const overlayStyle = {
  maxWidth: 660,
};
const overlayInnerStyle = {
  display: 'flex',
  alignItems: 'center',
};

export const Fee = (props: FeeProps) => {
  const { fee, symbol = '' } = props;

  return (
    <SectionStyled>
      <div className="left">
        <div className="title">Rabby fee</div>
        <Tooltip
          overlayStyle={overlayStyle}
          overlayInnerStyle={overlayInnerStyle}
          placement="top"
          title={
            "The charged fee depends on which token you're swapping. It has been charged from the current quote."
          }
        >
          <IconInfo className="text-14" />
        </Tooltip>
      </div>
      <div className="feeBox">
        <span className="fee">{fee}%</span>
        <span className="real-fee">0%</span>
        <Tooltip
          overlayStyle={overlayStyle}
          overlayInnerStyle={overlayInnerStyle}
          title={feeTips[fee](symbol)}
        >
          <IconQuestion className="text-14" />
        </Tooltip>
      </div>
    </SectionStyled>
  );
};
