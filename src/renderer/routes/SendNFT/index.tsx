import React, {
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
} from 'react';
import clsx from 'clsx';
import BigNumber from 'bignumber.js';
import { Input, Form, message, Button } from 'antd';
import { isValidAddress } from 'ethereumjs-util';
import { useLocation } from 'react-router-dom';
import { NFTItem } from '@rabby-wallet/rabby-api/dist/types';
import { useRbiSource } from '@/renderer/hooks/useRbiSource';
import { Account } from '@/isomorphic/types/rabbyx';
import { CHAINS } from '@debank/common';
import { UIContactBookItem } from '@/isomorphic/types/contact';
import { useWhitelist } from '@/renderer/hooks/rabbyx/useWhitelist';
import { findChainByEnum } from '@/renderer/utils';
import { isSameAddress } from '@/renderer/utils/address';
import { walletController } from '@/renderer/ipcRequest/rabbyx';
import { matomoRequestEvent } from '@/renderer/utils/matomo-request';
import { getKRCategoryByType } from '@/renderer/utils/transacation';
import { filterRbiSource } from '@/renderer/utils/ga-event';
import { ModalConfirm } from '@/renderer/components/Modal/Confirm';
import AccountCard from '@/renderer/components/AccountCard';
import { KEYRING_CLASS, KEYRING_PURPLE_LOGOS } from '@/renderer/utils/constant';
import NFTAvatar from '@/renderer/components/NFTAvatar';
import AddressViewer from '@/renderer/components/AddressViewer';
import NumberInput from '@/renderer/components/NFTNumberInput';
import IconExternal from '@/../assets/icons/tx-toast/external-link.svg';
import { copyText } from '@/renderer/utils/clipboard';
import { TipsWrapper } from '@/renderer/components/TipWrapper';
import styled from 'styled-components';
import { openExternalUrl } from '@/renderer/ipcRequest/app';
import { ContactListModal } from '../SendToken/components/ContactListModal';
import { ContactEditModal } from '../SendToken/components/ContactEditModal';
import { ChainSelect } from '../Swap/component/ChainSelect';

const SendNFTWrapper = styled.div`
  padding: 24px;
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 8px;
  margin: 0 auto;
  width: 600px;
  color: #fff;
  margin-top: 18px;
  .nft-info {
    padding-bottom: 16px;
    border-bottom: 1px solid rgba(0, 0, 0, 0.1);
    .nft-avatar {
      margin-right: 12px;
      border: none;
    }
    &__detail {
      flex: 1;
      color: #fff;

      h3 {
        color: #fff;
        font-size: 17px;
        font-weight: 500;
      }
      p {
        margin-bottom: 8px;
        color: rgba(255, 255, 255, 0.6);
        font-size: 13px;
        font-weight: 500;
        display: flex;
        .field-name {
          width: 67px;
        }
        .value {
          display: flex;
        }

        .icon {
          cursor: pointer;
          width: 14px;
          height: 14px;
        }

        .icon-copy {
          cursor: pointer;
        }
      }
    }
  }
  .section-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 20px;
    color: #fff;
    font-size: 13px;
    font-weight: 500;

    .ant-input {
      padding: 0;
      font-weight: 500;
      font-size: 13px;
      color: #fff;
      text-align: center;
      border-radius: 0;
      border: 0.5px solid rgba(255, 255, 255, 0.1);
    }
  }
  .section {
    background: rgba(0, 0, 0, 0.06);
    border-radius: 8px;
    padding: 24px;
    margin-bottom: 24px;
    .account-card {
      margin-bottom: 20px;
    }
    .section-title {
      font-size: 13px;
      line-height: 16px;
      color: rgba(255, 255, 255, 0.6);
      margin-bottom: 8px;
      display: flex;
      align-items: flex-end;
      .token-balance {
        font-size: 14px;
        line-height: 17px;
        color: #fff;
        display: flex;
        align-items: center;
      }
    }
  }
  .ant-input {
    background: rgba(255, 255, 255, 0.06);
    border: 1px solid rgba(255, 255, 255, 0.4);
    border-radius: 4px;
    color: #fff;
    font-size: 15px;
    line-height: 18px;
    padding: 19px 17px;
    &:focus {
      box-shadow: none;
    }
  }
  .tokenInput {
    height: 72px;
    padding: 0 16px;
    background: rgba(255, 255, 255, 0.06);
    border: 1px solid rgba(255, 255, 255, 0.4);
    border-radius: 4px;
  }
  .ant-form-item:nth-last-child(1) {
    margin-bottom: 0;
  }
  .icon-contact {
    width: 20px;
    height: 20px;
    margin-left: 12px;
    cursor: pointer;
  }
  .contact-info {
    display: flex;
    align-items: center;
    padding: 3px 6px;
    border: 0.5px solid rgba(134, 151, 255, 0.5);
    border-radius: 2px;
    color: #8697ff;
    font-size: 12px;
    line-height: 14px;
    cursor: pointer;
    background-color: transparent;
    transition: background-color 0.3s;
    .icon {
      width: 16px;
      height: 16px;
      margin-right: 4px;
    }
    &:hover {
      background-color: rgba(134, 151, 255, 0.1);
    }
    &.disabled {
      opacity: 0.5;
      cursor: default;
      &:hover {
        background-color: transparent;
      }
    }
  }
  .balance-error {
    font-weight: 400;
    font-size: 13px;
    line-height: 16px;
    text-align: right;
    color: #ff8080;
  }
  .token-info {
    margin-top: 8px;
    border-radius: 4px;
    padding: 25px 16px 16px;
    position: relative;
    z-index: 1;
    background: url('rabby-internal://assets/icons/send-token/contract-bg.svg');
    background-size: cover;
    .section-field {
      display: flex;
      justify-content: space-between;
      font-size: 13px;
      line-height: 16px;
      color: rgba(255, 255, 255, 0.4);
      margin-bottom: 8px;
      .address-viewer-text.normal {
        font-size: 13px;
        line-height: 16px;
        color: rgba(255, 255, 255, 0.4);
        font-weight: normal;
        margin-right: 0;
      }
      .icon-copy {
        width: 14px;
        height: 14px;
        margin-left: 6px;
        cursor: pointer;
        opacity: 0.4;
      }
      &:nth-last-child(1) {
        margin-bottom: 0;
      }
    }
  }

  .sendBtn {
    width: 552px;
    height: 56px;
    border-radius: 8px;
    font-weight: 500;
    font-size: 20px;
    line-height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;

    &:hover {
      box-shadow: 0px 16px 40px rgba(29, 35, 74, 0.2);
    }

    &[disabled] {
      background: #8697ff;
      color: white;
      opacity: 0.6;
      box-shadow: none;
      border-color: transparent;
      cursor: not-allowed;
    }
  }

  .whitelist-alert {
    display: flex;
    font-weight: 400;
    font-size: 13px;
    line-height: 16px;
    color: #ff8080;
    margin-top: 16px;
    margin-bottom: 16px;
    justify-content: center;
    .icon-check {
      width: 14px;
      height: 14px;
      margin-right: 4px;
    }
    &__content {
      max-width: 550px;
      margin-bottom: 0;
    }
    &.granted {
      color: #fff;
    }
  }

  .to-address {
    .ant-input {
      background: rgba(255, 255, 255, 0.06) !important;
    }
    .ant-input-status-error:not(.ant-input-disabled):not(.ant-input-borderless).ant-input,
    .ant-input-status-error:not(.ant-input-disabled):not(.ant-input-borderless).ant-input:hover {
      border-color: #ff8080;
    }
    .ant-form-item-explain-error {
      padding-top: 8px;
      color: #ff8080;
    }
  }

  .footer {
    padding-top: 24px;
    position: relative;

    &::before {
      position: absolute;
      content: '';
      top: 0;
      left: -24px;
      width: 598px;
      border-top: 1px solid rgba(255, 255, 255, 0.1);
    }
  }
`;

const SendNFT = () => {
  const location = useLocation();
  const { state } = location;
  const rbisource = useRbiSource();

  console.log('state', location, state);

  const [currentAccount, setCurrentAccount] = useState<Account | null>(null);
  const [nftItem, setNftItem] = useState<NFTItem | null>(
    state?.nftItem || null
  );
  const [chain, setChain] = useState<CHAINS_ENUM | undefined>(
    state?.nftItem
      ? Object.values(CHAINS).find(
          (item) => item.serverId === state.nftItem.chain
        )?.enum
      : undefined
  );

  const amountInputEl = useRef<any>(null);

  const { useForm } = Form;

  const [form] = useForm<{ to: string; amount: number }>();
  const [contactInfo, setContactInfo] = useState<null | UIContactBookItem>(
    null
  );
  const [inited, setInited] = useState(false);
  const [sendAlianName, setSendAlianName] = useState<string | null>(null);
  const [showEditContactModal, setShowEditContactModal] = useState(false);
  const [showListContactModal, setShowListContactModal] = useState(false);
  const [editBtnDisabled, setEditBtnDisabled] = useState(true);
  const [showContactInfo, setShowContactInfo] = useState(false);
  const [showWhitelistAlert, setShowWhitelistAlert] = useState(false);
  const [temporaryGrant, setTemporaryGrant] = useState(false);
  const [toAddressInWhitelist, setToAddressInWhitelist] = useState(false);

  const {
    whitelist,
    enable: whitelistEnabled,
    init: initWhiteList,
  } = useWhitelist();

  const whitelistAlertContent = useMemo(() => {
    if (!whitelistEnabled) {
      return {
        content: 'Whitelist disabled. You can transfer to any address.',
        success: true,
      };
    }
    if (toAddressInWhitelist) {
      return {
        content: 'The address is whitelisted',
        success: true,
      };
    }
    if (temporaryGrant) {
      return {
        content: 'Temporary permission granted',
        success: true,
      };
    }
    return {
      success: false,
      content: (
        <>
          The address is not whitelisted.
          <br /> I agree to grant temporary permission to transfer.
        </>
      ),
    };
  }, [temporaryGrant, toAddressInWhitelist, whitelistEnabled]);

  const canSubmit =
    isValidAddress(form.getFieldValue('to')) &&
    new BigNumber(form.getFieldValue('amount')).isGreaterThan(0) &&
    (!whitelistEnabled || temporaryGrant || toAddressInWhitelist);
  const handleClickContractId = () => {
    if (!chain || !nftItem) return;
    const targetChain = findChainByEnum(chain);
    if (!targetChain) return;
    openExternalUrl(
      targetChain.scanLink.replace(/tx\/_s_/, `address/${nftItem.contract_id}`)
    );
  };

  const handleFormValuesChange = async (
    changedValues: {
      to?: string;
      amount?: number;
    } | null,
    {
      to,
    }: {
      to: string;
      amount: number;
    }
  ) => {
    if (changedValues && changedValues.to) {
      setTemporaryGrant(false);
    }
    if (!to || !isValidAddress(to)) {
      setEditBtnDisabled(true);
      setShowWhitelistAlert(false);
    } else {
      setEditBtnDisabled(false);
      setShowWhitelistAlert(true);
      setToAddressInWhitelist(
        !!whitelist.find((item) => isSameAddress(item, to))
      );
    }
    const alianName = await walletController.getAlianName(to.toLowerCase());
    if (alianName) {
      setContactInfo({ address: to, name: alianName });
      setShowContactInfo(true);
    } else if (contactInfo) {
      setContactInfo(null);
    }
  };

  const handleSubmit = async ({
    to,
    amount,
  }: {
    to: string;
    amount: number;
  }) => {
    if (!nftItem) return;

    try {
      matomoRequestEvent({
        category: 'Send',
        action: 'createTx',
        label: [
          findChainByEnum(chain)?.name,
          getKRCategoryByType(currentAccount?.type),
          currentAccount?.brandName,
          'nft',
          filterRbiSource('sendNFT', rbisource) && rbisource,
        ].join('|'),
      });

      walletController.transferNFT(
        {
          to,
          amount,
          tokenId: nftItem.inner_id,
          chainServerId: nftItem.chain,
          contractId: nftItem.contract_id,
          abi: nftItem.is_erc1155 ? 'ERC1155' : 'ERC721',
        },
        {
          ga: {
            category: 'Send',
            source: 'sendNFT',
            trigger: filterRbiSource('sendNFT', rbisource) && rbisource,
          },
        }
      );
    } catch (e) {
      message.error((e as any)?.message);
    }
  };

  const handleClickWhitelistAlert = () => {
    if (whitelistEnabled && !temporaryGrant && !toAddressInWhitelist) {
      ModalConfirm({
        title: 'Grant temporary permission',
        height: 268,
        onOk: () => {
          setTemporaryGrant(true);
        },
      });
    }
  };

  const handleConfirmContact = (account: UIContactBookItem) => {
    setShowListContactModal(false);
    setShowEditContactModal(false);
    setContactInfo(account);
    const values = form.getFieldsValue();
    const to = account ? account.address : '';
    if (!account) return;
    form.setFieldsValue({
      ...values,
      to,
    });
    handleFormValuesChange(null, {
      ...values,
      to,
    });
    amountInputEl.current?.focus();
  };

  const handleCancelEditContact = () => {
    setShowEditContactModal(false);
  };

  const handleListContact = () => {
    setShowListContactModal(true);
  };

  const handleEditContact = () => {
    if (editBtnDisabled) return;
    setShowEditContactModal(true);
  };

  const initByCache = async () => {};

  const init = async () => {
    const account = await walletController.syncGetCurrentAccount();
    await initWhiteList();

    if (!account) {
      return;
    }

    setCurrentAccount(account);
    setInited(true);
  };

  const getAlianName = useCallback(async () => {
    const alianName = await walletController.getAlianName(
      currentAccount?.address || ''
    );
    setSendAlianName(alianName || '');
  }, [currentAccount?.address]);

  useEffect(() => {
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (inited) initByCache();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inited]);

  useEffect(() => {
    if (currentAccount) {
      getAlianName();
    }
  }, [currentAccount, getAlianName]);

  useEffect(() => {
    if (nftItem) {
      if (!chain) {
        const nftChain = Object.values(CHAINS).find(
          (item) => item.serverId === nftItem.chain
        )?.enum;
        if (!nftChain) {
          // history.replace('/');
        } else {
          setChain(nftChain);
        }
      }
    }
  }, [nftItem, chain]);

  if (!chain) {
    return null;
  }

  return (
    <SendNFTWrapper>
      {/* <PageHeader onBack={handleClickBack} forceShowBack>
        Send NFT'
      </PageHeader> */}
      {nftItem && (
        <Form
          form={form}
          onFinish={handleSubmit}
          initialValues={{
            to: '',
            amount: 1,
          }}
          onValuesChange={handleFormValuesChange}
        >
          {/* {chain && <TagChainSelector value={chain!} readonly />} */}
          <ChainSelect value={chain} readonly />

          <div className="section relative">
            <div className="section-title">From</div>
            <AccountCard
              icons={{
                mnemonic: KEYRING_PURPLE_LOGOS[KEYRING_CLASS.MNEMONIC],
                privatekey: KEYRING_PURPLE_LOGOS[KEYRING_CLASS.PRIVATE_KEY],
                watch: KEYRING_PURPLE_LOGOS[KEYRING_CLASS.WATCH],
              }}
              alianName={sendAlianName}
            />
            <div className="section-title">
              <span className="section-title__to">To</span>
              <div className="flex flex-1 justify-end items-center">
                {showContactInfo && (
                  <div
                    className={clsx('contact-info', {
                      disabled: editBtnDisabled,
                    })}
                    onClick={handleEditContact}
                  >
                    {contactInfo && (
                      <>
                        <img
                          src="rabby-internal://assets/icons/send-token/icon-edit.svg"
                          className="icon icon-edit"
                        />
                        <span
                          title={contactInfo.name}
                          className="inline-block align-middle truncate max-w-[240px]"
                        >
                          {contactInfo.name}
                        </span>
                      </>
                    )}
                  </div>
                )}
                <img
                  className="icon icon-contact"
                  src={
                    whitelistEnabled
                      ? 'rabby-internal://assets/icons/send-token/whitelist.svg'
                      : 'rabby-internal://assets/icons/send-token/contact.svg'
                  }
                  onClick={handleListContact}
                />
              </div>
            </div>
            <div className="to-address">
              <Form.Item
                name="to"
                rules={[
                  { required: true, message: 'Please input address' },
                  {
                    validator(_, value) {
                      if (!value) return Promise.resolve();
                      if (value && isValidAddress(value)) {
                        return Promise.resolve();
                      }
                      return Promise.reject(
                        new Error('This address is invalid')
                      );
                    },
                  },
                ]}
              >
                <Input
                  placeholder="Enter the address"
                  autoComplete="off"
                  autoFocus
                />
              </Form.Item>
            </div>
          </div>
          <div
            className={clsx('section', {
              'mb-40': !showWhitelistAlert,
            })}
          >
            <div className="nft-info flex">
              <NFTAvatar
                type={nftItem.content_type}
                content={nftItem.content}
                className="w-[80px] h-[80px]"
              />
              <div className="nft-info__detail">
                <h3>{nftItem.name}</h3>
                <p>
                  <span>Collection: </span>
                  <span className="value ml-4">
                    {nftItem.collection?.name || '-'}
                  </span>
                </p>
                <p>
                  <span>Contract: </span>
                  <span className="value gap-[4px] inline-flex items-center ml-4">
                    <AddressViewer
                      address={nftItem.contract_id}
                      // showArrow={false}
                    />
                    <img
                      src={IconExternal}
                      className="icon icon-copy opacity-80"
                      onClick={handleClickContractId}
                    />
                    {/* <Copy data={nftItem.contract_id} variant="address"></Copy> */}
                    <TipsWrapper hoverTips="Copy" clickTips="Copied">
                      <img
                        onClick={async () => {
                          if (!nftItem.contract_id) return;

                          await copyText(nftItem.contract_id);
                        }}
                        className="icon opacity-80"
                        src="rabby-internal://assets/icons/home/copy.svg"
                      />
                    </TipsWrapper>
                  </span>
                </p>
              </div>
            </div>
            <div className="section-footer">
              <span>Send amount</span>

              <Form.Item name="amount">
                <NumberInput
                  max={nftItem.amount}
                  nftItem={nftItem}
                  disabled={!nftItem.is_erc1155}
                  ref={amountInputEl}
                />
              </Form.Item>
            </div>
          </div>

          {showWhitelistAlert && (
            <div
              className={clsx(
                'whitelist-alert',
                !whitelistEnabled || whitelistAlertContent.success
                  ? 'granted'
                  : 'cursor-pointer'
              )}
              onClick={handleClickWhitelistAlert}
            >
              <p className="whitelist-alert__content text-center">
                {whitelistEnabled && (
                  <img
                    src={
                      whitelistAlertContent.success
                        ? 'rabby-internal://assets/icons/send-token/icon-check.svg'
                        : temporaryGrant
                        ? 'rabby-internal://assets/icons/send-token/temporary-grant-checkbox.svg'
                        : 'rabby-internal://assets/icons/send-token/icon-uncheck.svg'
                    }
                    className="icon icon-check inline-block relative -top-1"
                  />
                )}
                {whitelistAlertContent.content}
              </p>
            </div>
          )}

          <div className="footer flex justify-center">
            <Button
              disabled={!canSubmit}
              type="primary"
              htmlType="submit"
              size="large"
              className="sendBtn"
            >
              Send
            </Button>
          </div>
        </Form>
      )}
      <ContactEditModal
        open={showEditContactModal}
        address={form.getFieldValue('to')}
        onOk={handleConfirmContact}
        onCancel={handleCancelEditContact}
      />
      <ContactListModal
        visible={showListContactModal}
        onCancel={() => setShowListContactModal(false)}
        onOk={handleConfirmContact}
      />
    </SendNFTWrapper>
  );
};

export default SendNFT;
