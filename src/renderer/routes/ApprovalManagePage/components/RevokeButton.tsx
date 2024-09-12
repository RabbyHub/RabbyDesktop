import { RevokeSummary } from '@/isomorphic/approve';
import { Button, Modal } from 'antd';
import React, { useCallback } from 'react';

interface Props {
  revokeSummary: RevokeSummary;
  onRevoke: () => any | Promise<any>;
}

export const RevokeButton: React.FC<Props> = ({ revokeSummary, onRevoke }) => {
  const [isRevokeLoading, setIsRevokeLoading] = React.useState(false);

  const handleOnRevole = useCallback(async () => {
    if (isRevokeLoading) return;

    try {
      setIsRevokeLoading(true);
      await onRevoke();
    } catch (err) {
      console.error(err);
    } finally {
      setIsRevokeLoading(false);
    }
  }, [isRevokeLoading, onRevoke]);

  const handleRevoke = React.useCallback(() => {
    const hasPackedPermit2Sign = Object.values(
      revokeSummary?.permit2Revokes
    ).some((x) => x.tokenSpenders.length > 1);

    if (!hasPackedPermit2Sign) {
      return handleOnRevole();
    }

    Modal.info({
      closable: true,
      icon: null,
      closeIcon: (
        <img
          className="icon close w-[20px] h-[20px]"
          src="rabby-internal://assets/icons/modal/close.svg"
        />
      ),
      className: 'am-revoke-info-modal modal-support-darkmode',
      centered: true,
      title: (
        <h2 className="text-r-neutral-title-1 text-[20px] font-[600] break-words">
          A total of{' '}
          <span className="text-r-blue-default">
            {revokeSummary?.statics?.txCount}
          </span>{' '}
          signature is required
        </h2>
      ),
      content: (
        <p className="text-r-neutral-body text-center mb-0 text-[15px] font-normal leading-[normal]">
          Revoking the Permit2 contract has been simplified to require only one
          signature.
        </p>
      ),
      onOk: () => {
        handleOnRevole();
      },
      okText: 'Continue',
      okButtonProps: {
        className: 'w-[100%] h-[44px]',
      },
    });
  }, [handleOnRevole, revokeSummary]);

  const revokeTxCount = revokeSummary?.statics?.txCount;
  const spenderCount = revokeSummary?.statics?.spenderCount;
  return (
    <>
      {revokeTxCount > 1 ? (
        <div className="mt-[16px] h-[16px] mb-[16px] text-13 leading-[15px] text-[#fff]">
          {revokeTxCount} transaction(s) to be signed sequentially
        </div>
      ) : (
        <div className="mt-[24px]" />
      )}
      <Button
        loading={isRevokeLoading}
        className="w-[280px] h-[60px] text-[20px] am-revoke-btn rounded-[6px]"
        type="primary"
        size="large"
        disabled={!revokeTxCount}
        onClick={handleRevoke}
      >
        Revoke {spenderCount > 0 ? `(${spenderCount})` : ''}
      </Button>
    </>
  );
};
