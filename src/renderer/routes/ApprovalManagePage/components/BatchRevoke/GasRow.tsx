import React from 'react';
import { formatGasCostUsd, formatTokenAmount } from '@/renderer/utils/number';
import { findChainByServerID } from '@/renderer/utils/chain';
import { Chain } from '@debank/common';
import clsx from 'clsx';
import { AssetApprovalSpenderWithStatus } from './useBatchRevokeTask';

interface Props {
  record: AssetApprovalSpenderWithStatus;
}

export const GasRow: React.FC<Props> = ({ record }) => {
  const { gasCostUsd, gasCostAmount } = record?.$status?.gasCost || {};

  const chainItem = findChainByServerID(
    record.$assetParent?.chain as Chain['serverId']
  );

  const gasCostUsdStr = React.useMemo(() => {
    if (!gasCostUsd) {
      return;
    }
    return `$${formatGasCostUsd(gasCostUsd)}`;
  }, [gasCostUsd]);

  const gasCostAmountStr = React.useMemo(() => {
    if (!gasCostAmount) {
      return;
    }
    return `${formatTokenAmount(gasCostAmount.toString(10), 6)} ${
      chainItem?.nativeTokenSymbol
    }`;
  }, [chainItem?.nativeTokenSymbol, gasCostAmount]);

  if (record.$status?.status === 'fail') {
    return null;
  }

  if (!record.$status || record.$status.status === 'pending') {
    return <div>-</div>;
  }

  if (!chainItem?.enum) return <div>-</div>;

  return (
    <div className="flex overflow-hidden">
      <span className="text-r-neutral-title1 font-medium text-14">
        {gasCostUsdStr}
      </span>
      <span
        className={clsx(
          'text-r-neutral-foot text-14 ml-6 font-normal',
          'truncate'
        )}
      >
        ({gasCostAmountStr})
      </span>
    </div>
  );
};
