import clsx from 'classnames';
import React, { useEffect, useState, useRef } from 'react';
import { Button } from 'antd';
import styled from 'styled-components';
import { BigNumber } from 'bignumber.js';
import {
  CHAINS,
  GAS_LEVEL_TEXT,
  MINIMUM_GAS_LIMIT,
} from '@/renderer/utils/constant';
import { GasLevel, TokenItem } from '@rabby-wallet/rabby-api/dist/types';
import { formatAmount } from '@/renderer/utils/number';
import { Modal } from '@/renderer/components/Modal/Modal';
import RabbyInput from '@/renderer/components/AntdOverwrite/Input';
import { findChain } from '@/renderer/utils/chain';

const StyledModal = styled(Modal)`
  .ant-modal-header {
    padding-top: 24px;
    padding-bottom: 16px;
  }
`;
interface GasSelectorProps {
  chainId: number;
  onChange(gas: GasLevel): void;
  gasList: GasLevel[];
  gas: GasLevel | null;
  visible: boolean;
  token: TokenItem;
  onClose(): void;
}

const GasSelectorWrapper = styled.div`
  padding: 0 32px 32px;
  .gas-selector {
    background: rgba(255, 255, 255, 0.1);
    border-radius: 6px;
    display: flex;
    padding: 16px;
    flex-direction: column;

    .left {
      margin-right: 8px;
      .icon-gas {
        width: 16px;
        height: 16px;
      }
    }
    .gas-info {
      flex: 1;
      line-height: 1;
      p {
        margin-bottom: 4px;
        &:nth-last-child(1) {
          margin-bottom: 0;
        }
      }
    }
    .top {
      display: flex;
      align-items: center;
      position: relative;
      width: 100%;
      height: 18px;
      line-height: 18px;
      color: #ffffff;
      font-weight: 500;
      font-size: 14px;
      .gasmoney {
        margin-left: 26px;
        font-size: 15px;
        line-height: 18px;
        font-weight: 500;
      }
      .usmoney {
        font-size: 12px;
        color: rgba(256, 256, 256, 0.8);
        margin-left: 8px;
      }
    }
    .card-container {
      height: 48px;
      margin-top: 12px;
      display: flex;
      justify-content: space-between;
      width: 100%;

      .card {
        width: 90px;
        height: 52px;
        background: rgba(255, 255, 255, 0.1);
        border-radius: 4px;
        display: flex;
        flex-direction: column;
        align-items: center;
        margin: 0 4px;
        border: 1px solid transparent;
        &:nth-child(1) {
          margin-left: 0;
        }
        &:nth-last-child(1) {
          margin-right: 0;
        }
        &:hover {
          border: 1px solid #8697ff;
        }
        &.active {
          background: rgba(134, 151, 255, 0.1);
          border: 1px solid #8697ff;
        }
        .gas-level {
          text-align: center;
          font-size: 12px;
          line-height: 14px;
          color: rgba(255, 255, 255, 0.8);
          margin: 9px auto 0;
        }
        .cardTitle {
          color: #fff !important;
          font-size: 13px !important;
          margin: 4px auto 0;
          font-weight: 500;
          &.active {
            color: #8697ff !important;
          }
        }
        .custom-input {
          margin: 4px auto 0;
        }
        .ant-input {
          color: #ffffff;
          text-align: center !important;
          font-size: 13px !important;
          padding-top: 0;
          font-weight: 500;
          &.active {
            color: #8697ff !important;
          }
        }
        .ant-input:focus,
        .ant-input-focused {
          color: #ffffff;
        }
      }
    }
  }
`;

const Description = styled.p`
  font-weight: 400;
  font-size: 13px;
  line-height: 18px;
  text-align: center;
  color: rgba(255, 255, 255, 0.8);
  margin: 0 0 30px;
`;

const Footer = styled.div`
  display: flex;
  justify-content: center;
  margin-top: 32px;
`;

const GasSelector = ({
  chainId,
  onChange,
  gasList,
  gas,
  visible,
  token,
  onClose,
}: GasSelectorProps) => {
  const customerInputRef = useRef(null);
  const [customGas, setCustomGas] = useState<string | number>(0);
  const chain = findChain({
    id: chainId,
  })!;
  const [selectedGas, setSelectedGas] = useState(gas);

  const handleConfirmGas = () => {
    if (!selectedGas) return;
    if (selectedGas.level === 'custom') {
      onChange({
        ...selectedGas,
        price: Number(customGas) * 1e9,
        level: selectedGas.level,
      });
    } else {
      onChange({
        ...selectedGas,
        level: selectedGas.level,
      });
    }
  };

  const handleCustomGasChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    if (/^\d*(\.\d*)?$/.test(e.target.value)) {
      setCustomGas(e.target.value);
    }
  };

  const panelSelection = (e: any, value: GasLevel) => {
    e.stopPropagation();
    let target: GasLevel = value;
    console.log(value);
    if (value.level === selectedGas?.level) return;

    if (value.level === 'custom') {
      console.log('selectedGas', selectedGas);
      if (selectedGas && selectedGas.level !== 'custom' && !value.price) {
        target =
          gasList.find((item) => item.level === selectedGas.level) || value;
      }
      console.log('target', target);
      setCustomGas(Number(target.price) / 1e9);
      setSelectedGas({
        ...target,
        level: 'custom',
      });
      customerInputRef.current?.focus();
    } else {
      setSelectedGas({
        ...value,
        level: value?.level,
      });
    }
  };

  const customGasConfirm = (e: any) => {
    const res = {
      level: 'custom',
      price: Number(e?.target?.value),
      front_tx_count: 0,
      estimated_seconds: 0,
      base_fee: gasList[0].base_fee,
    };
    setSelectedGas({
      ...res,
      price: Number(res.price),
      level: res.level,
    });
  };

  useEffect(() => {
    if (selectedGas?.level === 'custom') {
      setSelectedGas({
        level: 'custom',
        price: Number(customGas) * 1e9,
        front_tx_count: 0,
        estimated_seconds: 0,
        base_fee: 0,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customGas]);

  useEffect(() => {
    setSelectedGas(gas);
  }, [gas]);

  return (
    <StyledModal
      title="Set Gas Price (Gwei)"
      open={visible}
      onBack={onClose}
      onCancel={onClose}
      className="send-token-gas-selector"
      closable={false}
      maskClosable
      width="480px"
      centered
    >
      <GasSelectorWrapper>
        <Description>
          The gas cost will be reserved from the transfer amount based on the
          gas price you set
        </Description>
        <div className="gas-selector gray-section-block">
          <div className="top">
            <p>Gas</p>
            <p className="gasmoney">
              {`${formatAmount(
                new BigNumber(selectedGas ? selectedGas.price : 0)
                  .times(MINIMUM_GAS_LIMIT)
                  .div(1e18)
                  .toFixed()
              )} ${chain.nativeTokenSymbol}`}
            </p>
            <p className="usmoney">
              ≈ $
              {new BigNumber(selectedGas ? selectedGas.price : 0)
                .times(MINIMUM_GAS_LIMIT)
                .div(1e18)
                .times(token.price)
                .toFixed(2)}
            </p>
          </div>
          <div className="card-container">
            {gasList.map((item) => (
              <div
                key={item.level}
                className={clsx('card cursor-pointer', {
                  active: selectedGas?.level === item.level,
                })}
                onClick={(e) => panelSelection(e, item)}
              >
                <div className="gas-level">
                  {GAS_LEVEL_TEXT[item.level as keyof typeof GAS_LEVEL_TEXT]}
                </div>
                <div
                  className={clsx('cardTitle', {
                    'custom-input': item.level === 'custom',
                    active: selectedGas?.level === item.level,
                  })}
                >
                  {item.level === 'custom' ? (
                    <RabbyInput
                      className="cursor-pointer"
                      value={customGas}
                      defaultValue={customGas}
                      onChange={handleCustomGasChange}
                      onClick={(e) => panelSelection(e, item)}
                      onPressEnter={customGasConfirm}
                      ref={customerInputRef}
                      autoFocus={selectedGas?.level === item.level}
                      min={0}
                      bordered={false}
                    />
                  ) : (
                    item.price / 1e9
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
        <Footer>
          <Button
            type="primary"
            size="large"
            className="w-[200px]"
            onClick={handleConfirmGas}
          >
            Confirm
          </Button>
        </Footer>
      </GasSelectorWrapper>
    </StyledModal>
  );
};

export default GasSelector;
