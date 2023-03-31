import { CHAINS_ENUM, CHAINS } from '@debank/common';
import { DEX_ENUM } from '@rabby-wallet/rabby-swap';
import { Button, Modal } from 'antd';
import { useState } from 'react';
import styled from 'styled-components';
import { Checkbox } from '@/renderer/components/Checkbox';
import { useSwap } from '@/renderer/hooks/rabbyx/useSwap';
import IconClose from '@/../assets/icons/swap/modal-close.svg?rc';
import { DEX } from '../constant';

export const Wrapper = styled.div`
  position: absolute;
  top: 30px;
  left: 0;
  width: 100%;

  .back {
    position: absolute;
    left: 12px;
    top: 50%;
    transform: translateY(-50%);
    width: 6px !important;
    height: 12px !important;
    cursor: pointer;
  }

  .title {
    font-weight: 700;
    font-size: 22px;
    line-height: 26px;
    text-align: center;
    color: var(--color-purewhite);
  }

  .closeWrapper {
    position: absolute;
    right: 22px;
    top: 0;
  }
  .closeIcon {
    cursor: pointer;
    width: 24px !important;
    height: 25px !important;
  }
  & + .dexList {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
    margin-top: 56px;

    & + .footerArea {
      margin-top: 30px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      width: 100%;
      padding-top: 30px;
      position: relative;
      &::before {
        border-top: 1px solid rgba(255, 255, 255, 0.1);
        position: absolute;
        top: 0;
        left: -28px;
        content: '';
        height: 0;
        width: calc(100% + 28px + 28px);
      }
      .selected,
      .unSelected {
        padding: 0 28px;
        padding-bottom: 20px;
        font-weight: 400;
        font-size: 14px;
        line-height: 14px;
        color: #e9e9e9;
        text-align: center;
      }
      .unSelected {
        font-weight: 400;
      }
    }
  }
`;

const ButtonWrapper = styled(Button)`
  /* width: 316px; */
  width: 100%;
  height: 55px;
  border-radius: 8px;
  font-weight: 500;
  font-size: 17px;
`;

const DexItemBox = styled.div`
  width: 100%;
  height: 128px;
  background: #505664;
  border: 1px solid transparent;
  padding: 20px;
  background: rgba(255, 255, 255, 0.06);
  border-radius: 8px;
  cursor: pointer;

  display: flex;
  flex-direction: column;
  justify-content: space-between;
  &:hover {
    background: rgba(255, 255, 255, 0.15);
    border: 1px solid rgba(255, 255, 255, 0.15);

    .dex {
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    }
  }
  .dex {
    padding-bottom: 20px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1px solid rgba(255, 255, 255, 0.06);

    .dexBox {
      display: flex;
      align-items: center;
      .logo {
        width: 32px;
        height: 32px;
        border-radius: 9999px;
        margin-right: 8px;
      }
      .name {
        font-weight: 500;
        font-size: 22px;
        color: var(--color-purewhite);
      }
    }
  }

  .chain {
    display: flex;
    align-items: center;
    margin-top: 14px;

    .chain-tips {
      font-weight: 400;
      font-size: 12px;
      line-height: 14px;
      color: #949cab;
    }

    .chain-logo {
      display: flex;
      align-items: center;
      gap: 6px;
      margin-left: 6px;

      .logo {
        width: 14px;
        height: 14px;
      }
    }
  }
`;

interface DexItemProps {
  imgSrc: string;
  name: string;
  checked?: boolean;
  onChecked: (check: boolean) => void;
  chainList: CHAINS_ENUM[];
}

const DexItem = (props: DexItemProps) => {
  const { imgSrc, name, onChecked, chainList, checked = false } = props;

  return (
    <DexItemBox
      onClick={() => {
        onChecked(!checked);
      }}
    >
      <div className="dex">
        <div className="dexBox">
          <img className="logo" src={imgSrc} />
          <span className="name">{name}</span>
        </div>
        <Checkbox
          width="20px"
          height="20px"
          unCheckBackground="#414858"
          checked={checked}
          onChange={onChecked}
          className="checkBox"
        />
      </div>
      <div className="chain">
        <span className="chain-tips">Support Chains: </span>
        <div className="chain-logo">
          {chainList.map((e) => {
            const chainInfo = CHAINS[e];
            return (
              <img
                key={chainInfo.name}
                src={chainInfo.logo}
                alt={chainInfo.name}
                className="logo"
              />
            );
          })}
        </div>
      </div>
    </DexItemBox>
  );
};

const StyledModal = styled(Modal)`
  .ant-modal-content {
    background-color: transparent;
  }
  .ant-modal-body {
    background: #525767;
    box-shadow: 0px 24px 80px rgba(19, 20, 26, 0.18);
    border-radius: 12px;
    padding: 30px 28px;
    padding-bottom: 18px;
    height: 664px;
  }
`;

interface DexSelectDrawerProps {
  visible: boolean;
  onClose: () => void;
  onConfirm?: () => void;
}

export const DexSelect = (props: DexSelectDrawerProps) => {
  const { visible, onClose, onConfirm } = props;

  const swapState = useSwap();
  const dexId = swapState.swap.selectedDex;

  const [checkedId, setCheckedId] = useState(() => dexId || '');

  const close = () => {
    onClose();
  };

  const handleDexId = async () => {
    if (!checkedId) return;
    await swapState.setSwapDexId(checkedId as DEX_ENUM);
    onConfirm?.();
  };

  return (
    <StyledModal
      closable={false}
      onCancel={close}
      width={536}
      centered
      open={visible}
      title={null}
      footer={null}
      destroyOnClose
    >
      <Wrapper>
        <div className="title">Swap tokens on different DEXes</div>
        <div className="closeWrapper">
          <IconClose className="closeIcon" onClick={close} />
        </div>
      </Wrapper>
      <div className="dexList">
        {Object.entries(DEX).map(([id, { name, chains, logo }]) => {
          return (
            <DexItem
              key={id}
              checked={checkedId === id}
              imgSrc={logo}
              name={name}
              onChecked={(bool) => {
                setCheckedId((oId) => {
                  if (bool) {
                    return id;
                  }
                  if (oId === id) {
                    return '';
                  }
                  return oId;
                });
              }}
              chainList={chains}
            />
          );
        })}
      </div>
      <div className="footerArea">
        {checkedId ? (
          <span className="selected">
            The quotes and order will be directly provided by {checkedId}
          </span>
        ) : (
          <span className="unSelected">
            Select the DEX you're looking for or switch it at any time
          </span>
        )}

        <ButtonWrapper
          type="primary"
          onClick={handleDexId}
          disabled={!checkedId}
        >
          Confirm
        </ButtonWrapper>
      </div>
    </StyledModal>
  );
};
