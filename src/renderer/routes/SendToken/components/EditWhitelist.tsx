import { Checkbox } from '@/renderer/components/Checkbox';
import { ModalConfirm } from '@/renderer/components/Modal/Confirm';
import { IDisplayedAccountWithBalance } from '@/renderer/hooks/rabbyx/useAccountToDisplay';
import { isSameAddress } from '@/renderer/utils/address';
import { Button } from 'antd';
import { useState, useCallback } from 'react';
import styled from 'styled-components';
import { AccountItem, AccountItemSelector } from './AccountItem';
import { StyledModal as CModal } from './ContactEditModal';

const StyledModal = styled(CModal)`
  .ant-modal-content {
    background: #525767;
    box-shadow: 0px 24px 80px rgba(19, 20, 26, 0.18);
  }
  .ant-modal-header {
    padding-bottom: 0;
  }
`;
const ContentWrapper = styled.div`
  height: 100%;
  margin-top: 12px;
  display: flex;
  flex-direction: column;
  & > .desc {
    font-weight: 400;
    font-size: 14px;
    line-height: 18px;
    text-align: center;
    color: #ffffff;
    opacity: 0.8;
    height: 60px;
  }

  & > .list {
    margin: 0 -32px;
    padding: 0 32px;
    /* margin-top: 24px; */
    padding-bottom: 24px;

    flex: 1;
    overflow: auto;
  }
  & > .btnBox {
    padding-top: 32px;
    position: relative;
    &::before {
      content: '';
      width: calc(100% + 32px + 32px);
      position: absolute;
      top: 0;
      left: -32px;
      height: 0;
      border-top: 1px solid rgba(255, 255, 255, 0.1);
    }
    .editBtn {
      width: 100%;
      height: 44px;
      border-radius: 4px;
      font-weight: 500;
      font-size: 13px;
      line-height: 16px;
      text-align: center;
      color: #ffffff;
    }
  }

  .uncheck {
    width: 20px;
    height: 20px;
    border-radius: 100%;
    background-color: transparent;
    border: 1.5px solid #ffffff;
  }
`;

export const EditWhitelist = ({
  onCancel,
  onConfirm,
  whitelist,
  accountsList,
}: {
  onCancel(): void;
  onConfirm(list: string[]): void;
  whitelist: string[];
  accountsList: IDisplayedAccountWithBalance[];
}) => {
  const [checkedList, setCheckedList] = useState<string[]>(whitelist);
  const [hasAnyChange, setHasAnyChange] = useState(false);

  const handleClickBack = useCallback(() => {
    if (hasAnyChange) {
      ModalConfirm({
        centered: true,
        title: 'Discard Changes',
        content: 'Changes you made will not be saved',
        height: 268,
        onOk: () => {
          onCancel();
        },
      });
    } else {
      onCancel();
    }
  }, [hasAnyChange, onCancel]);

  const handleCheckAddress = (checked: boolean, address: string) => {
    setHasAnyChange(true);
    if (checked) {
      setCheckedList([...checkedList, address]);
    } else {
      setCheckedList(
        checkedList.filter((item) => !isSameAddress(item, address))
      );
    }
  };

  const handleSaveWhitelist = () => {
    ModalConfirm({
      centered: true,
      title: 'Save to Whitelist',
      height: 268,
      onOk: () => {
        onConfirm(checkedList);
      },
    });
  };

  return (
    <StyledModal
      centered
      width={520}
      bodyStyle={{ height: 680, paddingBottom: 32 }}
      open
      title="Select Address"
      onCancel={handleClickBack}
      backable
      onBack={handleClickBack}
    >
      <ContentWrapper>
        <div className="desc">
          Select the address you want to whitelist and save.{' '}
        </div>

        <div className="list">
          {accountsList.map((account) => (
            <AccountItemSelector
              key={`${account.brandName}-${account.address}`}
            >
              <Checkbox
                width="20px"
                height="20px"
                className="mr-12"
                unCheckBackground="transparent"
                background="#27C193"
                checked={
                  !!checkedList.find((item) =>
                    isSameAddress(account.address, item)
                  )
                }
                checkIcon={
                  checkedList.find((item) =>
                    isSameAddress(account.address, item)
                  ) ? null : (
                    <div className="uncheck" />
                  )
                }
                onChange={(checked) =>
                  handleCheckAddress(checked, account.address)
                }
              />
              <AccountItem account={account} />
            </AccountItemSelector>
          ))}
        </div>

        <div className="btnBox">
          <Button
            type="primary"
            size="large"
            className="editBtn"
            onClick={handleSaveWhitelist}
          >
            Save to Whitelist ({checkedList.length})
          </Button>
        </div>
      </ContentWrapper>
    </StyledModal>
  );
};
