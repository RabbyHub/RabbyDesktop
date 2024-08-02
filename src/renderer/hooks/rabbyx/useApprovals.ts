import {
  walletOpenapi,
  walletTestnetOpenapi,
} from '@/renderer/ipcRequest/rabbyx';
import { atom, useAtom } from 'jotai';
import { useAsync } from 'react-use';
import { ApprovalStatus } from '@rabby-wallet/rabby-api/dist/types';
import { KEYRING_TYPE } from '@/renderer/utils/constant';
import { appIsProd } from '@/main/utils/env';
import { useCurrentAccount } from './useAccount';
import { useShowTestnet } from './useShowTestnet';

const approvalRiskAlertAtom = atom({
  mainnet: 0,
  testnet: 0,
});

function accumulateApprovalRiskAlertCount(statues: ApprovalStatus[]) {
  return statues.reduce(
    (accu, now) =>
      accu + now.nft_approval_danger_cnt + now.token_approval_danger_cnt,
    0
  );
}

export function useApprovalRiskAlertCount() {
  const { currentAccount } = useCurrentAccount();
  const { isShowTestnet } = useShowTestnet();

  const [approvalRiskAlert, setApprovalRiskAlert] = useAtom(
    approvalRiskAlertAtom
  );

  useAsync(async () => {
    if (!currentAccount?.address) return;
    if (currentAccount.type === KEYRING_TYPE.WatchAddressKeyring && appIsProd) {
      return;
    }
    try {
      const mainnetState = await walletOpenapi.approvalStatus(
        currentAccount.address
      );
      let testnetState: typeof mainnetState | null;
      if (isShowTestnet) {
        testnetState = await walletTestnetOpenapi.approvalStatus(
          currentAccount.address
        );
      }

      setApprovalRiskAlert((prev) => {
        return {
          ...prev,
          mainnet: accumulateApprovalRiskAlertCount(mainnetState || []),
          testnet: accumulateApprovalRiskAlertCount(testnetState || []),
        };
      });
    } catch (err) {
      console.error(err);
    }
  }, [currentAccount?.address, setApprovalRiskAlert]);

  return {
    approvalRiskAlertCount:
      approvalRiskAlert.mainnet +
      (isShowTestnet ? approvalRiskAlert.testnet : 0),
  };
}
