import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Button, Modal } from 'antd';
import styled from 'styled-components';

import { NFTApproval, TokenItem } from '@rabby-wallet/rabby-api/dist/types';

import NFTAvatar from '@/renderer/components/NFTAvatar';

import clsx from 'clsx';
import TokenWithChain, {
  IconWithChain,
} from '@/renderer/components/TokenWithChain';
import BigNumber from 'bignumber.js';
import { InfoCircleOutlined } from '@ant-design/icons';
import {
  ApprovalItem,
  ContractApprovalItem,
  getSpenderApprovalAmount,
} from '@/renderer/utils/approval';
import { ensureSuffix } from '@/isomorphic/string';
import { ApprovalSpenderItemToBeRevoked } from '@/isomorphic/approve';
import { findChainByServerID } from '@/renderer/utils/chain';
import { Chain } from '@debank/common';
import IconClose from '@/../assets/icons/swap/modal-close.svg?rc';
import { splitNumberByStep } from '@/renderer/utils/number';
import IconExternal from '@/../assets/icons/common/share.svg';
import { getTokenSymbol } from '@/renderer/utils';
import IconNotChecked from '../icons/check-unchecked.svg';
import IconChecked from '../icons/check-checked.svg';
import ApprovalsNameAndAddr from './NameAndAddr';
import {
  findIndexRevokeList,
  maybeNFTLikeItem,
  openScanLinkFromChainItem,
  toRevokeItem,
} from '../utils';

import IconUnknown from '../icons/icon-unknown-1.svg';
import IconUnknownNFT from '../icons/unknown-nft.svg';
import { ApprovalContractItem } from './ApprovalContractItem';

import { NFTItemBadge, Permit2Badge } from './Badges';
import ApprovalAmountInfo from './ApprovalAmountInfo';

const ModalStyled = styled(Modal)`
  .ant-modal-header {
    border-bottom: none;
  }
`;

export const RevokeApprovalModal = (props: {
  item?: ApprovalItem;
  visible: boolean;
  onClose: () => void;
  className?: string;
  revokeList?: ApprovalSpenderItemToBeRevoked[];
  onConfirm: (items: ApprovalSpenderItemToBeRevoked[]) => void;
}) => {
  const { item, visible, onClose, className, revokeList, onConfirm } = props;

  const [selectedList, setSelectedList] = useState<number[]>([]);

  const handleConfirm = async () => {
    if (item?.list) {
      onConfirm(
        selectedList
          .map((idx) => {
            const spenderHost = item.list[idx];
            return toRevokeItem(item, spenderHost, true);
          })
          .filter(Boolean) as ApprovalSpenderItemToBeRevoked[]
      );
      onClose();
    }
  };
  const isSelectedAll = selectedList.length === item?.list?.length;
  const handleSelectAll = useCallback(() => {
    if (item?.list) {
      setSelectedList((e) =>
        e.length === item.list.length
          ? []
          : Array(item.list.length)
              .fill(0)
              .map((_, i) => i)
      );
    }
  }, [item]);
  const subTitle = useMemo(() => {
    if (item?.type === 'contract') {
      return 'Approved Token and NFT';
    }
    return 'Approved to the following Contracts';
  }, [item?.type]);

  const displayList = useMemo(() => {
    if (!item) return null;
    if (item?.type === 'contract') {
      return item?.list.map((spenderHost, index) => {
        const chainItem = findChainByServerID(spenderHost.chain);

        const maybeContractForNFT = maybeNFTLikeItem(spenderHost);

        const itemName = !maybeContractForNFT
          ? getTokenSymbol(spenderHost)
          : 'inner_id' in spenderHost
          ? ensureSuffix(
              spenderHost.contract_name || 'Unknown',
              ` #${spenderHost.inner_id}`
            )
          : spenderHost.contract_name || 'Unknown';

        /**
         * @description
         * 1. In general, the items from [host].spenders/[host].spender have same properties about nft/nft-collection/amounts, so we just need to check the first of them
         * 2. It must not be non-token type contract
         */
        const associatedSpender =
          '$indexderSpender' in spenderHost
            ? spenderHost.$indexderSpender
            : null;
        const spenderValues = associatedSpender
          ? getSpenderApprovalAmount(associatedSpender)
          : null;

        return (
          <div
            // eslint-disable-next-line react/no-array-index-key
            key={`contract-${spenderHost.chain}-${index}`}
            className={clsx(
              'display-contract-item relative px-[16px] h-[56px] flex justify-between items-center cursor-pointer',
              index === item.list.length - 1 && 'rounded-b-[6px]'
            )}
            onClick={(event) => {
              if ((event.target as HTMLElement)?.id !== 'copyIcon') {
                setSelectedList((l) =>
                  l.includes(index)
                    ? l.filter((s) => s !== index)
                    : [...l, index]
                );
              }
            }}
          >
            {'logo_url' in spenderHost ? (
              <TokenWithChain
                width="24px"
                height="24px"
                hideChainIcon
                token={spenderHost as unknown as TokenItem}
              />
            ) : (
              <NFTAvatar
                className="w-[24px] h-[24px]"
                type={(spenderHost as NFTApproval)?.content_type || 'image'}
                content={
                  (spenderHost as NFTApproval)?.content ||
                  (spenderHost as any)?.collection?.logo_url
                }
                thumbnail
                // chain={(spenderHost as NFTApproval)?.chain}
                unknown={IconUnknownNFT}
              />
            )}
            {'spender' in spenderHost ? (
              <div className="flex flex-col ml-[8px]">
                <div className="text-13 font-medium leading-[15px] inline-flex items-center justify-start">
                  {itemName}

                  {maybeContractForNFT && (
                    <img
                      onClick={(evt) => {
                        evt.stopPropagation();
                        openScanLinkFromChainItem(
                          chainItem?.scanLink,
                          spenderHost.spender.id
                        );
                      }}
                      src={IconExternal}
                      className={clsx('w-[12px] h-[12px] ml-6 cursor-pointer')}
                    />
                  )}
                </div>
                <NFTItemBadge className="mt-2" contractListItem={spenderHost} />
              </div>
            ) : (
              <div className="ml-[8px] text-13 font-medium leading-[15px] max-w-[180px] truncate">
                {getTokenSymbol(spenderHost)}
              </div>
            )}
            {associatedSpender?.permit2_id && (
              <Permit2Badge
                className="ml-[9px]"
                contractSpender={associatedSpender}
              />
            )}

            <div className="ml-auto flex items-center justify-between flex-shrink-0">
              <ApprovalAmountInfo
                className="mr-[8px]"
                {...(spenderValues
                  ? {
                      amountValue: spenderValues.displayAmountText,
                      balanceNumText: spenderValues.balanceNumText,
                      balanceUnitText: spenderValues.balanceUnitText,
                      minWidthLimit: spenderValues.isCollectionHasNFTs,
                    }
                  : {
                      amountValue:
                        'amount' in spenderHost ? spenderHost.amount : '',
                      balanceNumText: '',
                      balanceUnitText: '',
                    })}
              />
              <img
                src={
                  selectedList.includes(index) ? IconChecked : IconNotChecked
                }
                className="icon icon-checked w-[16px] h-[16px]"
              />
            </div>
          </div>
        );
      });
    }

    return item?.list.map((spender, index) => {
      const value = new BigNumber(spender.value || 0);
      const isUnlimited = value.gte(10 ** 9);
      const displayApprovalValue = isUnlimited
        ? 'Unlimited'
        : splitNumberByStep(value.toFixed(2));

      const risky = ['danger', 'warning'].includes(spender.risk_level);
      const chainItem = findChainByServerID(spender.chain as Chain['serverId']);

      const fullName =
        spender.type === 'nft' && spender.nftToken
          ? ensureSuffix(
              spender.name || 'Unknown',
              ` #${spender.nftToken.inner_id}`
            )
          : spender.name || 'Unknown';

      return (
        <div
          key={spender.id}
          className={clsx(
            'display-noncontract-item relative px-[16px] flex justify-between',
            index === item.list.length - 1 && 'rounded-b-[6px]',
            !risky ? 'h-[51px]' : 'flex-col pt-[13px]'
          )}
          onClick={(event) => {
            if ((event.target as HTMLElement)?.id !== 'copyIcon') {
              setSelectedList((l) =>
                l.includes(index) ? l.filter((s) => s !== index) : [...l, index]
              );
            }
          }}
        >
          <div className="flex w-full justify-between items-center">
            <IconWithChain
              width="16px"
              height="16px"
              hideChainIcon
              iconUrl={chainItem?.logo || IconUnknown}
              chainServerId={item.chain}
            />
            <div className="flex flex-col ml-[12px]">
              <div className="text-13 font-medium leading-[15px] mb-2">
                {fullName}
              </div>
              <ApprovalsNameAndAddr
                className="justify-start"
                addressClass="text-12"
                copyIconClass="w-[14px] h-[14px]"
                address={spender.id}
              />
            </div>

            <div className="ml-auto flex justify-center items-center">
              <span
                className={clsx(
                  'mr-[14px] text-[13px] text-gray-subTitle',
                  item.type !== 'token' && 'hidden'
                )}
              >
                {displayApprovalValue}
              </span>
              <img
                src={
                  selectedList.includes(index) ? IconChecked : IconNotChecked
                }
                className="icon icon-checked"
              />
            </div>
          </div>
          {risky && (
            <div className="pt-[8px] pb-[16px]">
              <Alert
                className={clsx(
                  'rounded-[4px] px-[8px] py-[3px]',
                  spender.risk_level === 'danger' ? 'bg-[#ec5151]' : 'bg-orange'
                )}
                icon={
                  <InfoCircleOutlined className="text-white pt-[4px] self-start" />
                }
                banner
                message={
                  <span className="text-12 text-white">
                    {spender.risk_alert}
                  </span>
                }
                type="error"
              />
            </div>
          )}
        </div>
      );
    });
  }, [item, selectedList]);

  useEffect(() => {
    setSelectedList([]);
    if (visible && item?.list && revokeList) {
      const indexes: number[] = [];

      item.list.forEach((token, index) => {
        if (
          findIndexRevokeList(revokeList, {
            item: item as any as ContractApprovalItem,
            spenderHost: token,
            itemIsContractApproval: true,
          }) > -1
        ) {
          indexes.push(index);
        }
      });

      setSelectedList(indexes);
    }
  }, [visible, revokeList, item]);

  if (!item) return null;

  return (
    <ModalStyled
      centered
      width={450}
      visible={visible}
      onCancel={onClose}
      className={clsx('revoke-approval-modal', className)}
      bodyStyle={{
        height: '640px',
        maxHeight: '640px',
      }}
      destroyOnClose
      footer={null}
      title="Approvals"
      closeIcon={<IconClose />}
    >
      <div className="mt-4 h-[100%] overflow-hidden">
        <div className="mb-18">
          <ApprovalContractItem data={[item]} index={0} showNFTAmount />
        </div>

        <section className="mb-[6px] flex justify-between items-center">
          <span className="text-12 text-[#fff]/80">{subTitle}</span>
          <div
            className={clsx(
              isSelectedAll ? 'w-[80px]' : 'w-[67px]',
              'h-[22px] text-12 cursor-pointer flex items-center justify-center bg-blue-light bg-opacity-[0.2] text-center text-blue-light rounded-[2px]'
            )}
            onClick={handleSelectAll}
          >
            {/* Select All, Unselect All */}
            {!isSelectedAll ? 'Select All' : 'Unselect All'}
          </div>
        </section>

        <section
          className={clsx(
            'max-h-[calc(100%-158px)] overflow-x-hidden overflow-y-scroll rounded-[6px] approval-list'
          )}
          style={{
            // @ts-expect-error
            overflowY: 'overlay',
          }}
        >
          {displayList}
        </section>
      </div>
      <div
        className={clsx(
          'absolute modal-btn-wrapper flex flex-col items-center justify-center left-0 bottom-0 w-full z-[99999]',
          'h-[76px] px-[24px]'
        )}
      >
        <Button
          style={{
            minWidth: 172,
            height: 44,
          }}
          type="primary"
          size="large"
          className="rounded-[6px] w-full"
          onClick={handleConfirm}
        >
          Confirm {selectedList.length > 0 ? `(${selectedList.length})` : ''}
        </Button>
      </div>
    </ModalStyled>
  );
};
