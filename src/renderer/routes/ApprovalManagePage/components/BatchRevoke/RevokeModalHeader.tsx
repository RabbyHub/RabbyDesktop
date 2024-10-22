import React from 'react';
import clsx from 'clsx';
import { useTranslation } from 'react-i18next';
import { ModalConfirm } from '@/renderer/components/Modal/Confirm';
import { BatchRevokeTaskType } from './useBatchRevokeTask';
import RcIconCloseCC from '../../icons/close-cc.svg?rc';

interface Props {
  totalApprovals: number;
  revokedApprovals: number;
  onClose: (needUpdate: boolean) => void;
  task: BatchRevokeTaskType;
}

export const RevokeModalHeader: React.FC<Props> = ({
  onClose,
  totalApprovals,
  revokedApprovals,
  task,
}) => {
  const { t } = useTranslation();
  const handleClose = React.useCallback(() => {
    if (task.status === 'idle') {
      return onClose(false);
    }
    if (task.status === 'completed') {
      return onClose(true);
    }

    task.pause();
    ModalConfirm({
      centered: true,
      width: 384,
      title: 'Cancel Remaining Revokes',
      className: 'confirm-revoke-modal',
      content: (
        <div>
          <div className="text-r-neutral-body text-15 leading-[22px] text-center">
            If you close this page, the remaining revokes will not be executed.
          </div>
        </div>
      ),
      okButtonProps: {
        type: 'primary',
        className: clsx(
          'w-full h-[44px]',
          'rounded-[6px]',
          'before:content-none'
        ),
      },
      okText: 'Confirm',
      height: 268,
      onOk: () => {
        onClose(true);
      },
    });
  }, [onClose, task]);

  return (
    <header className=" text-center relative">
      <div className="space-x-8 flex justify-center items-center">
        {(task.status === 'active' || task.status === 'paused') && (
          <img
            className={clsx(
              'text-r-blue-default',
              task.status === 'paused' ? 'loading-paused' : ''
            )}
            src="rabby-internal://assets/icons/address-management/loading.svg"
            alt=""
          />
        )}
        <span className="text-24 font-medium text-r-neutral-title-1">
          {t('page.approvals.revokeModal.batchRevoke')} ({revokedApprovals}/
          {totalApprovals})
        </span>
      </div>
      <div className="text-r-neutral-foot text-15 font-normal mt-12">
        {t('page.approvals.revokeModal.revoked')}{' '}
        {t('page.approvals.revokeModal.approvalCount', {
          count: revokedApprovals,
        })}
        丨{t('page.approvals.revokeModal.totalRevoked')}{' '}
        {t('page.approvals.revokeModal.approvalCount', {
          count: totalApprovals,
        })}
      </div>

      <div
        className="p-20 absolute right-0 top-0 -mt-20 -mr-20 cursor-pointer"
        onClick={handleClose}
      >
        <RcIconCloseCC className="w-[24px] h-[24px] text-r-neutral-foot" />
      </div>
    </header>
  );
};
