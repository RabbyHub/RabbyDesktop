import clsx from 'clsx';
import { memo, useMemo, useCallback, ChangeEventHandler } from 'react';
import { useToggle } from 'react-use';
import styled from 'styled-components';
import RabbyInput from '@/renderer/components/AntdOverwrite/Input';
import BigNumber from 'bignumber.js';

export const SlippageItem = styled.div<{
  active?: boolean;
  error?: boolean;
  hasAmount?: boolean;
}>`
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  border: 1px solid transparent;
  cursor: pointer;
  border-radius: 6px;
  width: 52px;
  height: 32px;
  font-size: 14px;
  font-weight: medium;
  background: rgba(0, 0, 0, 0.2);
  color: rgba(255, 255, 255, 0.6);
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
`;

const SLIPPAGE = ['0.1', '0.3', '0.5'];

const Wrapper = styled.section`
  .header {
    display: flex;
    justify-content: space-between;
    font-size: 14px;
    color: white;
    font-weight: 400;

    .field {
      color: rgba(255, 255, 255, 0.6);
    }
    .value {
      font-weight: 500;
      &.warn {
        color: #ebcc5b;
      }
    }
  }

  .slippage {
    display: flex;
    align-items: center;
    gap: 8px;
    padding-top: 10px;
  }

  .input {
    font-size: 14px;
    color: white;
    font-weight: medium;
    background: rgba(0, 0, 0, 0.2);
    border: 1px solid rgba(255, 255, 255, 0.4);
    border-radius: 6px;
    &:focus,
    &:hover,
    &:active {
      background: rgba(0, 0, 0, 0.2);
      border: 1px solid rgba(255, 255, 255, 0.8);
      box-shadow: none;
    }
    > .ant-input {
      border-radius: 0;
    }
  }

  .warning {
    padding: 10px;
    color: #ffdb5c;
    font-weight: 400;
    font-size: 13px;
    line-height: 16px;
    position: relative;
    border-radius: 4px;
    background: rgba(255, 219, 92, 0.1);
    margin-top: 15px;
    &:after {
      position: absolute;
      top: -8px;
      left: 50%;
      transform: translateX(-50%);
      content: '';
      width: 0;
      height: 0;
      border-width: 0 4px 8px 4px;
      border-color: transparent transparent rgba(255, 219, 92, 0.1) transparent;
      border-style: solid;
    }
  }
`;
interface SlippageProps {
  value: string;
  onChange: (n: string) => void;
  recommendValue?: number;
  slippageDisplay: string;
}
export const Slippage = memo((props: SlippageProps) => {
  const { value, onChange, recommendValue, slippageDisplay } = props;
  const [isCustom, setIsCustom] = useToggle(false);
  const [slippageOpen, setSlippageOpen] = useToggle(false);

  const [isLow, isHigh] = useMemo(() => {
    return [
      value?.trim() !== '' && Number(value || 0) < 0.1,
      value?.trim() !== '' && Number(value || 0) > 10,
    ];
  }, [value]);

  const setRecommendValue = useCallback(() => {
    onChange(new BigNumber(recommendValue || 0).times(100).toString());
  }, [onChange, recommendValue]);

  const tips = useMemo(() => {
    if (isLow) {
      return 'Low slippage may cause failed transactions due to high volatility';
    }
    if (isHigh) {
      return 'Transaction might be frontrun because of high slippage tolerance';
    }
    if (recommendValue) {
      return (
        <span>
          To prevent front-running, we recommend a slippage of{' '}
          <span onClick={setRecommendValue} className="underline">
            {new BigNumber(recommendValue || 0).times(100).toString()}
          </span>
          %
        </span>
      );
    }
    return null;
  }, [isHigh, isLow, recommendValue, setRecommendValue]);

  const onInputFocus: ChangeEventHandler<HTMLInputElement> = useCallback(
    (e) => {
      e.target?.select?.();
    },
    []
  );

  const onInputChange: ChangeEventHandler<HTMLInputElement> = useCallback(
    (e) => {
      const v = e.target.value;
      if (/^\d*(\.\d*)?$/.test(v)) {
        onChange(Number(v) > 50 ? '50' : v);
      }
    },
    [onChange]
  );

  return (
    <Wrapper>
      <div className="header">
        <span className="field">Slippage tolerance</span>
        <div
          className="flex items-center cursor-pointer"
          onClick={() => setSlippageOpen()}
        >
          <span className={clsx('value', !!tips && 'warn')}>
            {slippageDisplay}%
          </span>
          <img
            src="rabby-internal://assets/icons/swap/arrow-top.svg"
            className={clsx(
              'inline-block w-14 h-[15px]',
              !slippageOpen && 'transform rotate-180'
            )}
          />
        </div>
      </div>
      <div className={clsx('slippage', !slippageOpen && 'hidden')}>
        {SLIPPAGE.map((e) => (
          <SlippageItem
            key={e}
            onClick={(event) => {
              event.stopPropagation();
              setIsCustom(false);
              onChange(e);
            }}
            active={!isCustom && e === value}
          >
            {e}%
          </SlippageItem>
        ))}
        <div
          onClick={(event) => {
            event.stopPropagation();
            setIsCustom(true);
          }}
          className="flex-1"
        >
          <RabbyInput
            className={clsx('input')}
            bordered={false}
            value={value}
            onFocus={onInputFocus}
            onChange={onInputChange}
            placeholder="0.1"
            suffix="%"
          />
        </div>
      </div>

      {!!tips && <div className="warning">{tips}</div>}
    </Wrapper>
  );
});
