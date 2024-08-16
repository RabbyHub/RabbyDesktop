import clsx from 'clsx';
import {
  memo,
  useMemo,
  useCallback,
  ChangeEventHandler,
  useState,
  useEffect,
} from 'react';
import styled from 'styled-components';
import BigNumber from 'bignumber.js';
import { Trans, useTranslation } from 'react-i18next';
import i18n from '@/renderer/utils/i18n';

import IconArrowUp from '@/../assets/icons/swap/arrow-up.svg?rc';
import RabbyInput from '@/renderer/components/AntdOverwrite/Input';
import { useSlippageStore } from '../hooks/slippage';

export const SlippageItem = styled.div`
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  border: 1px solid transparent;
  cursor: pointer;
  border-radius: 6px;
  width: 80px;
  height: 32px;
  font-weight: 500;
  font-size: 13px;
  background: var(--r-neutral-card2, rgba(255, 255, 255, 0.06));
  border-radius: 4px;
  overflow: hidden;
  color: var(--r-neutral-title-1, #f7fafc);

  &:hover,
  &.active {
    background: var(--r-blue-light1, #424962);
    border-color: var(--r-blue-default, #7084ff);
  }
`;

const SLIPPAGE = ['0.1', '0.5'];

const Wrapper = styled.section`
  .slippage {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .input {
    font-weight: 500;
    font-size: 13px;
    height: 100%;
    border: none;
    border-radius: 4px;
    background: transparent;
    color: var(--r-neutral-title-1, #f7fafc);

    &:placeholder-shown {
      color: #707280;
    }
    .ant-input {
      border-radius: 0;
      font-weight: 500;
      background: transparent;
      font-weight: 500;
      font-size: 13px;
    }
  }

  .warning {
    padding: 10px;
    color: var(--r-red-default);
    font-weight: 400;
    font-size: 12px;
    line-height: 14px;
    position: relative;
    border-radius: 4px;
    background: var(--r-red-light);
    margin-top: 8px;
  }
`;
interface SlippageProps {
  value: string;
  displaySlippage: string;
  onChange: (n: string) => void;
  recommendValue?: number;
}
export const Slippage = memo((props: SlippageProps) => {
  const { t } = useTranslation();

  const { value, displaySlippage, onChange, recommendValue } = props;

  const {
    autoSlippage,
    isCustomSlippage,
    setAutoSlippage,
    setIsCustomSlippage,
  } = useSlippageStore();

  const [slippageOpen, setSlippageOpen] = useState(false);

  const [isLow, isHigh] = useMemo(() => {
    return [
      value?.trim() !== '' && Number(value || 0) < 0.1,
      value?.trim() !== '' && Number(value || 0) > 10,
    ];
  }, [value]);

  const setRecommendValue = useCallback(() => {
    onChange(new BigNumber(recommendValue || 0).times(100).toString());
    setAutoSlippage(false);
    setIsCustomSlippage(false);
  }, [onChange, recommendValue, setAutoSlippage, setIsCustomSlippage]);

  const tips = useMemo(() => {
    if (isLow) {
      return i18n.t(
        'page.swap.low-slippage-may-cause-failed-transactions-due-to-high-volatility'
      );
    }
    if (isHigh) {
      return i18n.t(
        'page.swap.transaction-might-be-frontrun-because-of-high-slippage-tolerance'
      );
    }
    if (recommendValue) {
      const slippage = new BigNumber(recommendValue || 0).times(100).toString();
      return (
        <span>
          <Trans
            i18nKey="page.swap.recommend-slippage"
            value={{
              slippage,
            }}
            slippage={new BigNumber(recommendValue || 0).times(100).toString()}
            t={t}
          >
            To prevent front-running, we recommend a slippage of{' '}
            <span
              onClick={setRecommendValue}
              className="underline cursor-pointer"
            >
              {{
                // @ts-ignore
                slippage,
              }}
            </span>
            %{' '}
          </Trans>
        </span>
      );
    }
    return null;
  }, [isHigh, isLow, recommendValue, setRecommendValue, t]);

  const onInputChange: ChangeEventHandler<HTMLInputElement> = useCallback(
    (e) => {
      const v = e.target.value;
      if (/^\d*(\.\d*)?$/.test(v)) {
        onChange(Number(v) > 50 ? '50' : v);
      }
    },
    [onChange]
  );

  const shouldAutoOpenSlippage = useMemo(() => {
    return isLow || isHigh || !!recommendValue;
  }, [isLow, isHigh, recommendValue]);

  useEffect(() => {
    if (shouldAutoOpenSlippage) {
      setSlippageOpen(true);
    }
  }, [shouldAutoOpenSlippage]);

  return (
    <div>
      <div
        className="flex justify-between cursor-pointer"
        onClick={() => {
          setSlippageOpen((e) => !e);
        }}
      >
        <span>{t('page.swap.slippage-tolerance')}</span>
        <span className="font-medium text-r-neutral-title-1 inline-flex items-center">
          <span className={clsx(!!tips && 'text-r-red-default')}>
            {displaySlippage}%{' '}
          </span>
          <IconArrowUp
            className={clsx(
              'transition-transform inline-block w-14 h-[15px]',
              !slippageOpen && 'transform rotate-180'
            )}
          />
        </span>
      </div>
      <Wrapper className="widget-has-ant-input">
        <div
          className={clsx(
            'slippage',
            slippageOpen ? 'mt-8' : 'h-0 overflow-hidden'
          )}
        >
          <SlippageItem
            onClick={(event) => {
              if (autoSlippage) {
                return;
              }
              event.stopPropagation();
              onChange(value);
              setAutoSlippage(true);
              setIsCustomSlippage(false);
            }}
            className={clsx(autoSlippage && 'active')}
          >
            {t('page.swap.Auto')}
          </SlippageItem>
          {SLIPPAGE.map((e) => (
            <SlippageItem
              key={e}
              onClick={(event) => {
                event.stopPropagation();
                setIsCustomSlippage(false);
                setAutoSlippage(false);
                onChange(e);
              }}
              className={clsx(
                !autoSlippage && !isCustomSlippage && e === value && 'active'
              )}
            >
              {e}%
            </SlippageItem>
          ))}
          <SlippageItem
            onClick={(event) => {
              event.stopPropagation();
              setAutoSlippage(false);
              setIsCustomSlippage(true);
            }}
            className={clsx('flex-1', isCustomSlippage && 'active')}
          >
            <RabbyInput
              className={clsx('input')}
              bordered={false}
              value={value}
              onChange={onInputChange}
              placeholder="0.1"
              suffix={<div>%</div>}
            />
          </SlippageItem>
        </div>

        {!!tips && <div className={clsx('warning')}>{tips}</div>}
      </Wrapper>
    </div>
  );
});
