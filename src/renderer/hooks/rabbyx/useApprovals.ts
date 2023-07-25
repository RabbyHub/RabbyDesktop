import { walletOpenapi } from '@/renderer/ipcRequest/rabbyx';
import { atom, useAtom } from 'jotai';
import { useAsync } from 'react-use';
import { useEffect } from 'react';
import { useCurrentAccount } from './useAccount';

const approvalRiskAlertAtom = atom(0);

export function useApprovalRiskAlertCount() {
  const { currentAccount } = useCurrentAccount();
  const [approvalRiskAlert, setApprovalRiskAlert] = useAtom(
    approvalRiskAlertAtom
  );

  const { value: approvalState } = useAsync(async () => {
    if (currentAccount?.address) {
      return walletOpenapi.approvalStatus(currentAccount.address);
    }
  }, [currentAccount?.address]);

  useEffect(() => {
    setApprovalRiskAlert(
      (approvalState || []).reduce(
        (pre, now) =>
          pre + now.nft_approval_danger_cnt + now.token_approval_danger_cnt,
        0
      )
    );
  }, [approvalState, setApprovalRiskAlert]);

  return {
    approvalRiskAlertCount: approvalRiskAlert,
  };
}
