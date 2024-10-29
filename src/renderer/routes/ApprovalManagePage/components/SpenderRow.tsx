import React from 'react';
import { Chain } from '@debank/common';
import { findChainByServerID } from '@/renderer/utils/chain';
import clsx from 'clsx';
import { Tooltip } from 'antd';
import { IconWithChain } from '@/renderer/components/TokenWithChain';
import {
  AssetApprovalSpender,
  SpenderInTokenApproval,
} from '@/renderer/utils/approval';
import IconUnknown from '../icons/icon-unknown-1.svg';
import ApprovalsNameAndAddr from './NameAndAddr';
import { openScanLinkFromChainItem } from '../utils';
import RcIconExternal from '../icons/icon-share-cc.svg';
import { Permit2Badge } from './Badges';

export const SpenderRow: React.FC<{
  spender: AssetApprovalSpender;
  hasPermit2Badge?: boolean;
  hasCopyIcon?: boolean;
  hasExternalIcon?: boolean;
  iconSize?: number;
}> = ({
  spender,
  hasPermit2Badge = true,
  hasCopyIcon = true,
  hasExternalIcon = true,
  iconSize = 18,
}) => {
  const asset = spender.$assetParent;
  if (!asset) return null;
  const chainItem = findChainByServerID(asset.chain as Chain['serverId']);
  // if (!chainItem) return null;

  // it maybe null
  const protocol = spender.protocol;

  const protocolName = protocol?.name || 'Unknown';

  return (
    <div className="flex items-center">
      <IconWithChain
        width={`${iconSize}px`}
        height={`${iconSize}px`}
        hideConer
        hideChainIcon
        iconUrl={chainItem?.logo || IconUnknown}
        chainServerId={asset?.chain}
        noRound={asset.type === 'nft'}
      />
      <ApprovalsNameAndAddr
        className="ml-[6px]"
        addressClass=""
        address={spender.id || ''}
        chainEnum={chainItem?.enum}
        copyIconClass="text-r-neutral-body"
        addressSuffix={
          <>
            <Tooltip
              overlayClassName="J-table__tooltip disable-ant-overwrite"
              overlay={protocolName}
            >
              <span className="contract-name ml-[4px]">({protocolName})</span>
            </Tooltip>
            {hasExternalIcon && (
              <img
                onClick={(evt) => {
                  evt.stopPropagation();
                  openScanLinkFromChainItem(chainItem?.scanLink, spender.id);
                }}
                src={RcIconExternal}
                className={clsx(
                  'ml-6 w-[16px] h-[16px] cursor-pointer text-r-neutral-body'
                )}
              />
            )}
          </>
        }
        tooltipAliasName
        openExternal={false}
        copyIcon={hasCopyIcon}
      />
      {spender.$assetContract?.type === 'contract' && hasPermit2Badge && (
        <Permit2Badge
          className="ml-[8px]"
          contractSpender={spender as SpenderInTokenApproval}
        />
      )}
    </div>
  );
};
