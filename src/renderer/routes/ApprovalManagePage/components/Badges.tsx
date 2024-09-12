/* eslint "react-hooks/exhaustive-deps": ["error"] */
/* eslint-enable react-hooks/exhaustive-deps */
import React, { useMemo } from 'react';
import clsx from 'clsx';
import { Tooltip } from 'antd';
import {
  ContractApprovalItem,
  SpenderInNFTApproval,
  SpenderInTokenApproval,
} from '@/renderer/utils/approval';

import IconBadgeCollection from '../icons/modal-badge-collection.svg';
import IconBadgeNFT from '../icons/modal-badge-nft.svg';

export function NFTItemBadge({
  className,
  contractListItem,
}: {
  className?: string;
  contractListItem: ContractApprovalItem['list'][number];
}) {
  const { isNFTToken, isNFTCollection } = useMemo(() => {
    const result = {
      isNFTToken: false,
      isNFTCollection: false,
    };

    if ('spender' in contractListItem) {
      const maybeNFTSpender = contractListItem.spender as SpenderInNFTApproval;

      result.isNFTCollection = !!maybeNFTSpender.$assetParent?.nftContract;
      result.isNFTToken =
        !result.isNFTCollection && !!maybeNFTSpender.$assetParent?.nftToken;
    }

    return result;
  }, [contractListItem]);

  if (isNFTCollection) {
    return (
      <div className={className}>
        <img className="w-[54px] h-[13px] block" src={IconBadgeCollection} />
      </div>
    );
  }
  if (isNFTToken) {
    return (
      <div className={className}>
        <img className="w-[26px] h-[13px] block" src={IconBadgeNFT} />
      </div>
    );
  }

  return null;
}

export function Permit2Badge({
  className,
  contractSpender,
}: {
  className?: string;
  contractSpender: SpenderInTokenApproval;
}) {
  const { permit2Id } = useMemo(() => {
    const result = {
      permit2Id: '',
    };

    result.permit2Id = contractSpender.permit2_id || '';

    return result;
  }, [contractSpender]);

  if (!permit2Id) return null;

  return (
    <Tooltip
      // visible
      overlayClassName="disable-ant-overwrite J_permit2-tooltip"
      overlay={
        <span>
          {`This approval is approved via Permit2 contract:\n${permit2Id}`}
        </span>
      }
    >
      <div
        className={clsx(
          className,
          'rounded-[4px]',
          'border-[0.5px] border-solid border-r-neutral-line',
          // 'px-[8px] py-[3px]',
          'w-[82px] px-[8px] h-[20px] leading-[1.3]'
        )}
      >
        <span
          className={clsx(
            'text-[12px] text-normal text-r-neutral-foot whitespace-nowrap',
            'inline-flex items-center justify-center'
          )}
        >
          Via Permit2
        </span>
      </div>
    </Tooltip>
  );
}
