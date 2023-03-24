import { RabbyAccount } from '@/isomorphic/types/rabbyx';
import { walletController } from '@/renderer/ipcRequest/rabbyx';
import { isSameAddress } from '@/renderer/utils/address';
import { SafeTransactionItem } from '@rabby-wallet/gnosis-sdk/dist/api';
import classNames from 'classnames';
import React from 'react';
import NameAndAddress from '../NameAndAddress';

const IconChecked = 'rabby-internal://assets/icons/queue/checked.svg';
const IconUnCheck = 'rabby-internal://assets/icons/queue/uncheck.svg';
const IconTagYou = 'rabby-internal://assets/icons/queue/tag-you.svg';

export interface Props {
  confirmations: SafeTransactionItem['confirmations'];
  threshold: number;
  owners: string[];
}

export const TxItemConfirmation: React.FC<Props> = ({
  confirmations,
  threshold,
  owners,
}) => {
  const [visibleAccounts, setVisibleAccounts] = React.useState<RabbyAccount[]>(
    []
  );
  const init = React.useCallback(async () => {
    const accounts = await walletController.getAllVisibleAccountsArray();
    setVisibleAccounts(accounts);
  }, []);
  React.useEffect(() => {
    init();
  }, [init]);

  return (
    <div>
      <div className="text-[12px] text-[#bfc1c8] mb-[16px]">
        {confirmations.length >= threshold ? (
          'Enough signature collected'
        ) : (
          <>
            <span className="text-white">
              {threshold - confirmations.length}
            </span>{' '}
            more confirmation needed
          </>
        )}
      </div>
      <ul className="list-none m-0 p-0">
        {owners.map((owner) => {
          const isConfirmation = confirmations.find((confirm) =>
            isSameAddress(confirm.owner, owner)
          );
          const isYou = visibleAccounts.find((account) =>
            isSameAddress(account.address, owner)
          );
          return (
            <li
              className={classNames('flex text-white mb-[16px]', {
                checked: confirmations.find((confirm) =>
                  isSameAddress(confirm.owner, owner)
                ),
              })}
              key={owner}
            >
              <img
                className={classNames('w-[14px] mr-[5px]', {
                  'opacity-40': !isConfirmation,
                })}
                src={isConfirmation ? IconChecked : IconUnCheck}
              />
              <NameAndAddress
                address={owner}
                className="text-[13px]"
                nameClass="text-[13px] text-white"
                addressClass="text-[13px] text-white"
                noNameClass="opacity-40"
                copyIconClass="opacity-100"
              />
              {isYou ? <img src={IconTagYou} className="ml-[5px]" /> : null}
            </li>
          );
        })}
      </ul>
    </div>
  );
};
