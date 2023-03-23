import { RabbyAccount } from '@/isomorphic/types/rabbyx';
import { walletController } from '@/renderer/ipcRequest/rabbyx';
import { isSameAddress } from '@/renderer/utils/address';
import { SafeTransactionItem } from '@rabby-wallet/gnosis-sdk/dist/api';
import classNames from 'classnames';
import React from 'react';
import NameAndAddress from '../NameAndAddress';

const IconChecked =
  'rabby-internal://assets/icons/address-management/check.svg';

const IconUnCheck =
  'rabby-internal://assets/icons/address-management/uncheck.svg';

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
      <div className="text-[12px] text-[#BFC1C8] mb-[16px]">
        {confirmations.length >= threshold ? (
          'Enough signature collected'
        ) : (
          <>
            <span className="number">{threshold - confirmations.length}</span>{' '}
            more confirmation needed
          </>
        )}
      </div>
      <ul className="list-none p-0">
        {owners.map((owner) => (
          <li
            className={classNames('flex text-white', {
              checked: confirmations.find((confirm) =>
                isSameAddress(confirm.owner, owner)
              ),
            })}
            key={owner}
          >
            <img
              className="w-[14px]"
              src={
                confirmations.find((confirm) =>
                  isSameAddress(confirm.owner, owner)
                )
                  ? IconChecked
                  : IconUnCheck
              }
            />
            <NameAndAddress
              address={owner}
              className="text-13"
              nameClass="max-129 text-13"
              addressClass="text-13"
              noNameClass="no-name"
            />
            {visibleAccounts.find((account) =>
              isSameAddress(account.address, owner)
            ) ? (
              <img src={IconTagYou} className="icon-tag" />
            ) : (
              <></>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};
