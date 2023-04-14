import { UIContactBookItem } from '@/isomorphic/types/contact';
import { toastMessage } from '@/renderer/components/TransparentToast';
import {
  IDisplayedAccountWithBalance,
  useAccountToDisplay,
} from '@/renderer/hooks/rabbyx/useAccountToDisplay';
import { useWhitelist } from '@/renderer/hooks/rabbyx/useWhitelist';
import { isSameAddress } from '@/renderer/utils/address';
import { Button } from 'antd';
import { useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';
import { AccountItem } from './AccountItem';
import { StyledModal as CModal } from './ContactEditModal';
import { EditWhitelist } from './EditWhitelist';

const StyledModal = styled(CModal)`
  .ant-modal-content {
    background: var(--theme-modal-content-bg);
    box-shadow: var(--theme-modal-content-shadow);
    border-radius: 12px;
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

export const ContactListModal = ({
  visible,
  onOk,
  onCancel,
}: {
  visible: boolean;
  onOk(account: UIContactBookItem): void;
  onCancel(): void;
}) => {
  const [editWhitelistVisible, setEditWhitelistVisible] = useState(false);

  const { enable: whitelistEnabled, whitelist, setWhitelist } = useWhitelist();
  const { accountsList, getAllAccountsToDisplay } = useAccountToDisplay();

  const sortedAccountsList = useMemo(() => {
    if (!whitelistEnabled) {
      return accountsList;
    }
    return [...accountsList].sort((a, b) => {
      let an = 0;
      let bn = 0;
      if (whitelist?.some((w) => isSameAddress(w, a.address))) {
        an = 1;
      }
      if (whitelist?.some((w) => isSameAddress(w, b.address))) {
        bn = 1;
      }
      return bn - an;
    });
  }, [accountsList, whitelist, whitelistEnabled]);

  const Desc = useMemo(() => {
    if (whitelistEnabled) {
      return 'Whitelist is enabled. You can only send assets to a whitelisted address or you can disable it in "Settings"';
    }
    return 'Whitelist is disabled. You can send assets to any address';
  }, [whitelistEnabled]);

  const handleSelectAddress = (account: IDisplayedAccountWithBalance) => {
    onOk({
      address: account.address,
      name: account.alianName,
    });
  };

  const handleSaveWhitelist = async (list: string[]) => {
    await setWhitelist(list);
    toastMessage({
      type: 'success',
      content: 'Whitelist Updated',
    });
    setEditWhitelistVisible(false);
  };

  useEffect(() => {
    getAllAccountsToDisplay();
  }, [getAllAccountsToDisplay]);

  return (
    <StyledModal
      centered
      width={520}
      bodyStyle={{ height: 680, padding: '0 32px 32px' }}
      open={visible}
      title="Select Address"
      onCancel={onCancel}
    >
      <ContentWrapper>
        <div className="desc">{Desc}</div>

        <div className="list">
          {sortedAccountsList.map((account) => (
            <AccountItem
              account={account}
              key={`${account.brandName}-${account.address}`}
              onClick={handleSelectAddress}
              disabled={
                whitelistEnabled
                  ? !whitelist.find((item) =>
                      isSameAddress(item, account.address)
                    )
                  : false
              }
            />
          ))}
        </div>

        {whitelistEnabled && (
          <div className="btnBox">
            <Button
              type="primary"
              size="large"
              className="editBtn"
              onClick={() => setEditWhitelistVisible(true)}
            >
              Edit Whitelist
            </Button>
          </div>
        )}

        {editWhitelistVisible && (
          <EditWhitelist
            onCancel={() => setEditWhitelistVisible(false)}
            onConfirm={handleSaveWhitelist}
            whitelist={whitelist}
            accountsList={accountsList}
          />
        )}
      </ContentWrapper>
    </StyledModal>
  );
};
