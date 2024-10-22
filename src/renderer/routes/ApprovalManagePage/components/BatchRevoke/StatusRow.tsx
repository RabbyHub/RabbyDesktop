import React from 'react';
import { formatGasCostUsd } from '@/renderer/utils/number';
import clsx from 'clsx';
import { useTranslation } from 'react-i18next';
import {
  AssetApprovalSpenderWithStatus,
  FailedCode,
  FailReason,
} from './useBatchRevokeTask';
import SuccessSVG from '../../icons/success.svg?rc';
import FailSVG from '../../icons/fail.svg?rc';
import LoadingSVG from '../../icons/loading.svg?rc';

interface Props {
  record: AssetApprovalSpenderWithStatus;
  onStillRevoke: () => void;
  isPaused: boolean;
}

export const StatusRow: React.FC<Props> = ({
  onStillRevoke,
  record,
  isPaused,
}) => {
  const divRef = React.useRef<HTMLDivElement>(null);
  const { t } = useTranslation();
  const [isStillRevoke, setIsStillRevoke] = React.useState(false);

  const handleStillRevoke = () => {
    setIsStillRevoke(true);
    onStillRevoke();
  };

  React.useEffect(() => {
    setIsStillRevoke(false);
    if (divRef.current && record.$status?.status === 'pending') {
      divRef.current.scrollIntoView({ block: 'end' });
    }
  }, [record.$status?.status]);

  return (
    <div
      ref={divRef}
      className="flex gap-x-6 flex-nowrap whitespace-nowrap items-center"
    >
      {(record.$status?.status === 'pending' || isStillRevoke) && (
        <>
          <LoadingSVG className="text-blue-light" />
          {isStillRevoke && (
            <span className="text-r-neutral-foot">
              {t('page.approvals.revokeModal.waitInQueue')}
            </span>
          )}
        </>
      )}
      {record.$status?.status === 'success' && <SuccessSVG />}
      {record.$status?.status === 'fail' && !isStillRevoke && (
        <>
          <FailSVG />
          <div
            className={clsx(
              'text-r-red-default text-14 font-medium',
              'flex items-center'
            )}
          >
            <span>{FailReason[record.$status.failedCode]}</span>
            {record.$status.failedCode === FailedCode.GasTooHigh &&
              record.$status.gasCost?.gasCostUsd !== undefined && (
                <div className="ml-2">
                  <span>
                    (Est. Gas ≈$
                    {formatGasCostUsd(record.$status.gasCost.gasCostUsd)})
                  </span>
                  <span
                    className="ml-8 text-r-blue-default cursor-pointer"
                    onClick={handleStillRevoke}
                  >
                    {t('page.approvals.revokeModal.stillRevoke')}
                  </span>
                </div>
              )}
          </div>
        </>
      )}
      {!record.$status?.status && (
        <span> {isPaused ? t('page.approvals.revokeModal.paused') : '-'} </span>
      )}
    </div>
  );
};
