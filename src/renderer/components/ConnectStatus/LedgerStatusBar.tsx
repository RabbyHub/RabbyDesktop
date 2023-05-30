import React from 'react';
import { useLedgerStatus } from './useLedgerStatus';
import { CommonStatusBar } from './CommonStatusBar';
import { LedgerSignal } from './LedgerSignal';

interface Props {
  className?: string;
}

export const LedgerStatusBar: React.FC<Props> = ({ className }) => {
  const { status, onClickConnect } = useLedgerStatus();

  const content = React.useMemo(() => {
    switch (status) {
      case 'CONNECTED':
        return 'Ledger is connected';
      default:
        return 'Ledger is not connected';
    }
  }, [status]);

  return (
    <CommonStatusBar
      Signal={<LedgerSignal size="small" />}
      className={className}
      onClickButton={onClickConnect}
      ButtonText={<>{(status === 'DISCONNECTED' || !status) && 'Connect'}</>}
      Content={content}
    />
  );
};
