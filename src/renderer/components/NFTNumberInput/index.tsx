import React, { forwardRef, useImperativeHandle, useRef } from 'react';
import styled from 'styled-components';
import { InputRef, Tooltip } from 'antd';
import clsx from 'clsx';
import { NFTItem } from '@rabby-wallet/rabby-api/dist/types';
import RabbyInput from '../AntdOverwrite/Input';

const NumberInputStyled = styled.div`
  &.number-input {
    display: flex;
    height: 24px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 2px;
    input::-webkit-outer-spin-button,
    input::-webkit-inner-spin-button {
      -webkit-appearance: none;
    }
    input[type='number'] {
      -moz-appearance: textfield;
    }
    .ant-input {
      width: 37px;
      height: 100%;
      background-color: rgba(255, 255, 255, 0.1) !important;
      border-radius: 0;
      border: 0.5px solid rgba(255, 255, 255, 0.1);

      &:hover,
      &:focus,
      .ant-input-focused {
        border-right-width: 0.5px !important;
      }
      &[disabled]:hover {
        border-color: rgba(255, 255, 255, 0.1);
      }
    }
    .action {
      font-size: 18px;
      width: 24px;
      height: 24px;
      line-height: 24px;
      text-align: center;
      color: white;
      background: rgba(255, 255, 255, 0.1);
      border: 0.5px solid rgba(255, 255, 255, 0.1);
      user-select: none;
      cursor: pointer;
      &.disabled {
        color: rgba(255, 255, 255, 0.4);
        cursor: not-allowed;
        background: rgba(255, 255, 255, 0.06);
      }
      &.left {
        border-right: none;
        border-radius: 2px 0px 0px 2px;
      }
      &.right {
        border-left: none;
        border-radius: 0px 2px 2px 0px;
      }
    }
  }
`;

interface Props {
  onChange?(val: number): void;
  max?: number;
  min?: number;
  value?: number;
  nftItem: NFTItem;
  disabled?: boolean;
}

const NumberInput = forwardRef<Pick<InputRef, 'focus'>, Props>(
  (
    { value, onChange, min = 1, max, nftItem, disabled = false }: Props,
    ref
  ) => {
    const handleInputValueChange: React.ChangeEventHandler<HTMLInputElement> = (
      e
    ) => {
      if (
        /^\d*$/.test(e.target.value) &&
        max &&
        Number(e.target.value) <= max
      ) {
        onChange?.(Number(e.target.value));
      }
    };

    const handleMinus = () => {
      if (!value || value <= min) return;
      onChange?.(value - 1);
    };

    const handleAdd = () => {
      if (!value || (max && value >= max)) return;
      onChange?.(value + 1);
    };

    const inputEl = useRef<InputRef>(null);

    useImperativeHandle(ref, () => ({
      focus: () => {
        inputEl?.current?.focus();
      },
    }));
    return (
      <NumberInputStyled className="number-input ">
        <div
          className={clsx('action left', { disabled: value && value <= min })}
          onClick={handleMinus}
        >
          -
        </div>
        <RabbyInput
          type="number"
          value={value}
          onChange={handleInputValueChange}
          disabled={disabled}
          ref={inputEl}
        />
        <Tooltip
          overlayClassName={clsx('rectangle max-w-max', {
            is1155: nftItem.is_erc1155,
          })}
          title={
            nftItem.is_erc1155
              ? `Your balance is ${nftItem.amount}`
              : 'Only one NFT of ERC 721 can be sent at a time'
          }
        >
          <div
            className={clsx('action right', {
              disabled: value && max && value >= max,
            })}
            onClick={handleAdd}
          >
            +
          </div>
        </Tooltip>
      </NumberInputStyled>
    );
  }
);

export default NumberInput;
