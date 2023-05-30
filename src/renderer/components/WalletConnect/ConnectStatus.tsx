import React from 'react';
import clsx from 'clsx';
import { WALLET_BRAND_TYPES } from '@/renderer/utils/constant';
import { useSessionStatus } from './useSessionStatus';
import { useDisplayBrandName } from './useDisplayBrandName';
import { useBrandNameHasWallet } from './useBrandNameHasWallet';

type Account = import('@/isomorphic/types/rabbyx').Account;
const TipInfoSVG = 'rabby-internal://assets/icons/walletconnect/tip-info.svg';
const TipWarningSVG =
  'rabby-internal://assets/icons/walletconnect/tip-warning.svg';
const TipSuccessSVG =
  'rabby-internal://assets/icons/walletconnect/tip-success.svg';

interface Props {
  brandName?: WALLET_BRAND_TYPES;
  account?: Account;
  className?: string;
}

export const ConnectStatus: React.FC<Props> = ({
  brandName,
  account,
  className,
}) => {
  const { status } = useSessionStatus(account, false, true);
  const [displayBrandName] = useDisplayBrandName(brandName);
  const hasWallet = useBrandNameHasWallet(displayBrandName);
  const IconClassName = 'inline-block mr-[6px] w-[14px] h-[14px] mb-2';

  console.log('ConnectStatus', status);
  const statusText = React.useMemo(() => {
    switch (status) {
      case 'RECEIVED':
        return (
          <div className="py-[15px]">
            <img src={TipSuccessSVG} className={IconClassName} />
            Scan successful. Waiting to be confirmed
          </div>
        );
      case 'REJECTED':
      case 'DISCONNECTED':
        return (
          <div className="py-[15px] whitespace-nowrap">
            <img src={TipInfoSVG} className={IconClassName} />
            Connection canceled. Please scan the QR code to retry
          </div>
        );
      case 'BRAND_NAME_ERROR':
        return (
          <div className="py-[8px]">
            <div>
              <img src={TipWarningSVG} className={IconClassName} />
              Wrong wallet app.
            </div>
            <div>Please use {displayBrandName} to connect</div>
          </div>
        );
      case 'ACCOUNT_ERROR':
        return (
          <div className="py-[8px]">
            <div>
              <img src={TipWarningSVG} className={IconClassName} />
              Address not match.
            </div>
            <div>Please switch address in your mobile wallet</div>
          </div>
        );
      case 'CONNECTED':
        return <div className="py-[15px]">Connected</div>;
      case 'ADDRESS_DUPLICATE':
        return (
          <div className="py-[15px]">
            The address you're are trying to import is duplicate
          </div>
        );
      default:
        return (
          <div className="py-[15px]">
            Scan with your {displayBrandName}
            {hasWallet ? '' : ' wallet'}
          </div>
        );
    }
  }, [status, displayBrandName, hasWallet]);

  const type = React.useMemo(() => {
    switch (status) {
      case 'RECEIVED':
      case 'CONNECTED':
        return 'success';
      case 'BRAND_NAME_ERROR':
      case 'ACCOUNT_ERROR':
      case 'ADDRESS_DUPLICATE':
        return 'warning';
      case 'REJECTED':
      case 'DISCONNECTED':
      default:
        return 'info';
    }
  }, [status]);

  return (
    <div
      className={clsx(
        'rounded-[4px] mt-[40px] m-auto',
        'w-[400px] text-center leading-none',
        'text-13',
        {
          'bg-[#FFFFFF1A] text-[#FFFFFF] font-medium': !type || type === 'info',
          'bg-[#27C1931A] text-[#27C193]': type === 'success',
          'bg-[#FFB0200D] text-[#FFB020]': type === 'warning',
        },
        className
      )}
    >
      {statusText}
    </div>
  );
};
