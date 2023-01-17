import { Input, Space, Tooltip } from 'antd';
import clsx from 'clsx';
import { memo, useMemo } from 'react';
import { useToggle } from 'react-use';
import styled from 'styled-components';
import IconInfo from '@/../assets/icons/swap/info-outline.svg?rc';
import IconTipDownArrow from '@/../assets/icons/swap/arrow-tips-down.svg?rc';
import IconArrowTips from '@/../assets/icons/swap/arrow.svg';

const MinReceivedBox = styled.div`
  margin-top: 8px;
  height: 30px;
  background: #505664;
  border-radius: 2px;
  display: flex;
  align-items: center;
  padding: 0 8px;
  font-weight: 400;
  font-size: 12px;
  line-height: 14px;
  color: rgba(255, 255, 255, 0.8);
`;

export const SlippageItem = styled.div<{
  active?: boolean;
  error?: boolean;
  hasAmount?: boolean;
}>`
  position: relative;
  width: 72px;
  height: 40px;
  display: flex;
  justify-content: center;
  align-items: center;
  border-radius: 4px;
  /* margin: 4px 0; */
  border: 1px solid transparent;
  cursor: pointer;
  font-weight: 500;
  font-size: 13px;
  line-height: 15px;
  background-color: ${(props) =>
    props.active
      ? props.error
        ? 'rgba(255,176,32,0.1)'
        : 'rgba(134, 151, 255, 0.1)'
      : '#505664'};
  color: ${(props) =>
    props.active
      ? props.error
        ? '#ffb020'
        : 'var(--color-primary)'
      : 'var(--color-purewhite)'};
  border-color: ${(props) =>
    props.active
      ? props.error
        ? '#ffb020'
        : 'var(--color-primary)'
      : 'transparent'};

  &:hover {
    background-color: ${(props) =>
      props.active
        ? props.error
          ? 'rgba(255,176,32,0.1)'
          : 'rgba(134, 151, 255, 0.1)'
        : 'rgba(134, 151, 255, 0.1)'};
    color: ${(props) =>
      props.active
        ? props.error
          ? '#ffb020'
          : 'var(--color-primary)'
        : 'var(--color-primary)'};
    border-color: ${(props) =>
      props.active
        ? props.error
          ? '#ffb020'
          : 'var(--color-primary)'
        : 'var(--color-primary)'};
  }
  &::after {
    opacity: ${(props) => (props.active && props.hasAmount ? 1 : 0)};
    content: '';
    position: absolute;
    left: 50%;
    bottom: -10px;
    transform: translateX(-50%);
    width: 0;
    height: 0;
    border-style: solid;
    border-width: 0 4px 6.9px 4px;
    border-color: transparent transparent #505664 transparent;
    border-radius: 2px;
  }
  & input {
    text-align: center;
    color: ${(props) =>
      props.active
        ? props.error
          ? '#ffb020'
          : 'var(--color-primary)'
        : 'var(--color-title)'};
  }
  & .ant-input-number-handler-wrap {
    display: none !important;
  }
`;

const SLIPPAGE = ['0.05', '0.5', '3'];

const tips =
  'Your transaction will revert if the price changes unfavorably by more than this percentage';

const Wrapper = styled.section`
  position: relative;
  cursor: pointer;
  color: #ffffff;
  .header {
    display: flex;
    justify-content: space-between;

    .title {
      font-weight: 400;
      font-size: 12px;
      line-height: 14px;
    }
  }

  .rate {
    display: flex;
    align-items: center;
    font-weight: 510;
    font-size: 12px;
    line-height: 14px;
    .orange {
      color: var(--color-orange);
    }
    .arrow {
      margin-left: 4px;
      transform: rotate(180deg);

      &.open {
        transform: rotate(0);
      }
    }
  }

  .content {
    align-items: center;
    justify-content: space-between;
    border-radius: 9999px;
    margin-top: 8px;
    display: none;
    &.flex {
      display: flex;
    }
  }
  /* text-12 mt-8 text-gray-content */
  .inputTips {
    font-size: 12px;
    margin-top: 8px;
    color: var(--color-comment1);
  }
`;
interface SlippageProps {
  value: string;
  onChange: (n: string) => void;
  amount?: string | number;
  symbol?: string;
}
export const Slippage = memo((props: SlippageProps) => {
  const { value, onChange, amount = '', symbol = '' } = props;
  const [open, setOpen] = useToggle(false);
  const [isCustom, setIsCustom] = useToggle(false);

  const [slippageError, isLow, isHigh] = useMemo(() => {
    const low = Number(value || 0) < 0.05;
    const high = Number(value || 0) > 10;
    return [low || high, low, high];
  }, [value]);

  const hasAmount = !!amount;

  return (
    <Wrapper>
      <div className="header" onClick={setOpen}>
        <Space size={4}>
          <div className="title">Slippage</div>
          <Tooltip autoAdjustOverflow placement="top" title={tips}>
            <IconInfo />
          </Tooltip>
        </Space>
        <div className={clsx('rate', (isLow || isHigh) && 'orange')}>
          {value} %
          <div className={clsx('arrow', open && 'open')}>
            <IconTipDownArrow />
          </div>
        </div>
      </div>

      <div className={clsx('content', open && 'flex')}>
        {SLIPPAGE.map((e) => (
          <SlippageItem
            key={e}
            onClick={(event) => {
              event.stopPropagation();
              setIsCustom(false);
              onChange(e);
            }}
            active={!isCustom && e === value}
            hasAmount={hasAmount}
          >
            {e}%
          </SlippageItem>
        ))}
        <SlippageItem
          onClick={(event) => {
            event.stopPropagation();
            setIsCustom(true);
          }}
          active={isCustom}
          error={isCustom && slippageError}
          hasAmount={hasAmount}
        >
          {isCustom ? (
            <Input
              autoFocus
              bordered={false}
              value={`${value}%`}
              onFocus={(e) => {
                e.target?.select?.();
              }}
              onChange={(e) => {
                const v = e.target.value.replace(/%/g, '');
                if (/^\d*(\.\d*)?$/.test(v)) {
                  onChange(Number(v) > 50 ? '50' : v);
                }
              }}
            />
          ) : (
            'Custom'
          )}
        </SlippageItem>
      </div>

      {amount && open && (
        <MinReceivedBox
          title={`Minimum received after slippage : ${amount} ${symbol}`}
        >
          Minimum received after slippage : {amount} {symbol}
        </MinReceivedBox>
      )}
      {isCustom && value.trim() === '' && (
        <div className="inputTips">Please input the custom slippage</div>
      )}
    </Wrapper>
  );
});
