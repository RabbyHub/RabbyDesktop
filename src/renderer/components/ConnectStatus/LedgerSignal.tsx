import React from 'react';
import { useLedgerStatus } from './useLedgerStatus';
import { Signal, Props } from '../Signal';

export const LedgerSignal: React.FC<Omit<Props, 'color'>> = (props) => {
  const { status } = useLedgerStatus();

  const signalColor = React.useMemo(() => {
    switch (status) {
      case undefined:
      case 'DISCONNECTED':
        return 'gray';

      case 'LOCKED':
        return 'orange';

      default:
        return 'green';
    }
  }, [status]);

  return <Signal {...props} className="mt-[4px]" color={signalColor} />;
};
