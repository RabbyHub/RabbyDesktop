import React from 'react';
import { findChainByServerID } from '@/renderer/utils/chain';
import { Chain } from '@debank/common';
import { getTxScanLink } from '@/renderer/utils';
import clsx from 'clsx';
import { openExternalUrl } from '@/renderer/ipcRequest/app';
import { AssetApprovalSpenderWithStatus } from './useBatchRevokeTask';
import ApprovalsNameAndAddr from '../NameAndAddr';
import RcIconExternal from '../../icons/icon-share-cc.svg';

interface Props {
  record: AssetApprovalSpenderWithStatus;
}

export const HashRow: React.FC<Props> = ({ record }) => {
  if (record.$status?.status === 'fail') {
    return null;
  }

  if (!record.$status || record.$status.status === 'pending') {
    return <div>-</div>;
  }

  const asset = record.$assetParent;
  if (!asset) return null;

  const chainItem = findChainByServerID(asset.chain as Chain['serverId']);
  const txHash = record.$status.txHash;

  return (
    <div
      className="cursor-pointer"
      onClick={(evt) => {
        evt.stopPropagation();
        openExternalUrl(getTxScanLink(chainItem!.scanLink, txHash));
      }}
    >
      <ApprovalsNameAndAddr
        address={txHash}
        copyIcon={false}
        addressSuffix={
          <img
            src={RcIconExternal}
            className={clsx('ml-4 w-[16px] h-[16px] text-r-neutral-foot')}
          />
        }
      />
    </div>
  );
};
