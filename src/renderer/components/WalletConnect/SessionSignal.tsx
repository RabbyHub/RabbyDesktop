import React from 'react';
import { useSessionStatus } from './useSessionStatus';
import { Signal } from '../Signal';

interface Props {
  size?: 'small' | 'normal';
  isBadge?: boolean;
  address: string;
  brandName: string;
  className?: string;
  pendingConnect?: boolean;
}

export const SessionSignal: React.FC<Props> = ({
  size = 'normal',
  isBadge,
  address,
  brandName,
  className,
  pendingConnect,
}) => {
  const { status } = useSessionStatus(
    {
      address,
      brandName,
    },
    pendingConnect
  );

  const bgColor = React.useMemo(() => {
    switch (status) {
      case 'ACCOUNT_ERROR':
      case 'BRAND_NAME_ERROR':
        return 'orange';

      case undefined:
      case 'DISCONNECTED':
      case 'RECEIVED':
      case 'REJECTED':
        return 'gray';

      default:
        return 'green';
    }
  }, [status]);

  return (
    <Signal
      className={className}
      size={size}
      isBadge={isBadge}
      color={bgColor}
    />
  );
};
