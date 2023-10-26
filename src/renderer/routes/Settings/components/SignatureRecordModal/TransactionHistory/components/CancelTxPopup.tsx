import { TransactionHistoryItem } from '@/isomorphic/types/rabbyx';
import { Modal } from '@/renderer/components/Modal/Modal';
import { CANCEL_TX_TYPE } from '@/renderer/utils/constant';
import { Tooltip } from 'antd';
import clsx from 'clsx';
import styled, { createGlobalStyle } from 'styled-components';

const GlobalStyle = createGlobalStyle`
  .cancel-tx-popup {
    .ant-modal-header {
      padding: 0;
    }

    .ant-modal-title .title {
      display: inline-flex;
      align-items: center;
      justify-content: center;

      color: var(--r-neutral-title-1, #F7FAFC);
      text-align: center;
      font-size: 20px;
      font-weight: 500;
      line-height: 24px;
    }

    .ant-modal-content {
      padding: 0;
      padding-top: 20px;
      width: 100%;
      background: var(--r-neutral-bg-1, #3D4251);
    }

    .ant-modal-body {
      overflow-y: overlay;
      padding: 20px 20px 24px 20px !important;
    }

    .ant-modal-close-x {
      padding: 22px 20px;
      opacity: 0.5;
    }
  }
`;

const OptionsList = styled.div`
  .option-item {
    display: flex;
    align-items: center;

    border-radius: 6px;
    background: var(--r-neutral-card-2, rgba(255, 255, 255, 0.06));
    padding: 12px 15px;
    border: 1px solid transparent;
    cursor: pointer;

    & + .option-item {
      margin-top: 12px;
    }

    /* &.is-selected {
      border: 1px solid var(--r-blue-default, #7084ff);
      background: var(--r-blue-light-1, #eef1ff);
    } */

    &:not(.is-disabled):hover {
      border: 1px solid var(--r-blue-default, #7084ff);
      background: var(--r-blue-light-1, rgba(112, 132, 255, 0.1));
    }

    &.is-disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    &-title {
      color: var(--r-neutral-title-1, #f7fafc);
      font-size: 15px;
      font-weight: 500;
      line-height: 18px;
      margin-bottom: 4px;
    }

    &-desc {
      color: var(--r-neutral-body, #d3d8e0);
      font-size: 13px;
      font-weight: 400;
      line-height: 16px;
    }
  }
`;

interface Props {
  visible?: boolean;
  onClose?: () => void;
  onCancelTx?: (mode: CANCEL_TX_TYPE) => void;
  tx: TransactionHistoryItem;
}
export const CancelTxPopup = ({ visible, onClose, onCancelTx, tx }: Props) => {
  const options = [
    {
      title: 'Quick Cancel',
      desc: 'Cancel before broadcasting, no gas fee',
      value: CANCEL_TX_TYPE.QUICK_CANCEL,
      tips: `Only supported for transactions that haven't broadcast`,
      disabled: tx.pushType !== 'low_gas' || tx.hash,
    },
    {
      title: 'On-chain Cancel',
      desc: 'New transaction to cancel, requires gas',
      value: CANCEL_TX_TYPE.ON_CHAIN_CANCEL,
    },
  ];
  return (
    <>
      <GlobalStyle />
      <Modal
        title="Cancel transaction"
        open={visible}
        onCancel={onClose}
        closable
        className="cancel-tx-popup"
        width={400}
        centered
      >
        <OptionsList>
          {options.map((item) => {
            return (
              <Tooltip
                title={item.disabled ? item.tips || '' : ''}
                key={item.value}
                overlayClassName="max-w-[335px]"
                placement="top"
                arrowPointAtCenter
              >
                <div
                  className={clsx(
                    'option-item',
                    item.disabled && 'is-disabled'
                  )}
                  onClick={() => {
                    if (item.disabled) {
                      return;
                    }
                    onCancelTx?.(item.value);
                  }}
                >
                  <div>
                    <div className="option-item-title">{item.title}</div>
                    <div className="option-item-desc">{item.desc}</div>
                  </div>
                  <img src="" alt="" />
                </div>
              </Tooltip>
            );
          })}
        </OptionsList>
      </Modal>
    </>
  );
};
