import { CHAINS_ENUM, CHAINS } from '@debank/common';
import { DEX_ENUM } from '@rabby-wallet/rabby-swap';
import { Button, Drawer } from 'antd';
import { useState } from 'react';
import styled from 'styled-components';
import { Checkbox } from '@/renderer/components/Checkbox';
import { useSwap } from '@/renderer/hooks/rabbyx/useSwap';
import IconClose from '@/../assets/icons/swap/modal-close.svg?rc';
import IconRcBack from '@/../assets/icons/swap/back.svg?rc';
import { DEX } from '../constant';

export const Wrapper = styled.div`
  position: absolute;
  top: 20px;
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
    font-size: 16px;
    text-align: center;
    color: var(--color-purewhite);
  }

  .closeWrapper {
    display: none;
    position: absolute;
    top: 50%;
    right: 20px;
    transform: translateY(-50%);
  }
  .closeIcon {
    cursor: pointer;
    width: 16px;
    height: 16px;
  }
  & + .dexList {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
    margin-top: 65px;

    & + .footerArea {
      position: absolute;
      left: 0;
      bottom: 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      width: 100%;
      padding-top: 15px;
      padding-bottom: 10px;
      border-top: 1px solid #4f5666;

      .selected,
      .unSelected {
        padding-bottom: 18px;
        font-weight: 500;
        font-size: 12px;
        color: #e9e9e9;
        text-align: center;
      }
      .unSelected {
        font-weight: 500;
      }
    }
  }
`;

const ButtonWrapper = styled(Button)`
  width: 316px;
  height: 46px;
  border-radius: 8px;
  font-weight: 500;
  font-size: 17px;

  &.ant-btn-primary[disabled] {
    background-color: #b6c1ff;
    box-shadow: 0px 12px 24px rgba(134, 151, 255, 0.12);
    border-color: rgba(134, 151, 255, 0.12);
    cursor: not-allowed;
  }
`;

const DexItemBox = styled.div`
  width: 317px;
  background: #505664;
  border-radius: 8px;
  border: 1px solid transparent;
  padding: 16px;
  cursor: pointer;
  &:hover {
    background: linear-gradient(90.98deg, #5e626b 1.39%, #656978 97.51%);
    box-shadow: 0px 6px 16px rgba(0, 0, 0, 0.07);
  }
  .dex {
    padding-bottom: 10px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1px solid rgba(180, 189, 204, 0.1);

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
        font-weight: 510;
        font-size: 15px;
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
      color: #707280;
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

interface DexSelectDrawerProps {
  visible: boolean;
  onClose: () => void;
}

export const DexSelectDrawer = (props: DexSelectDrawerProps) => {
  const { visible, onClose } = props;

  const swapState = useSwap();
  const dexId = swapState.swap.selectedDex;

  const [checkedId, setCheckedId] = useState(() => dexId || '');

  const close = () => {
    onClose();
  };

  const handleDexId = async () => {
    if (!checkedId) return;
    await swapState.setSwapDexId(checkedId as DEX_ENUM);
    onClose();
  };

  return (
    <Drawer
      getContainer={false}
      maskClosable={false}
      closable={false}
      placement="right"
      width="100%"
      open={visible}
      destroyOnClose
      bodyStyle={{
        padding: 0,
        paddingTop: '24px',
        overflow: 'hidden',
        backgroundColor: 'var(--swap-bg)',
      }}
      push={false}
    >
      <Wrapper>
        {!!dexId && <IconRcBack className="back" onClick={onClose} />}

        <div className="title">Swap tokens on different DEXes</div>
        <div className="closeWrapper">
          <IconClose
            className="closeIcon"
            viewBox="0 0 20 20"
            onClick={close}
          />
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
    </Drawer>
  );
};
