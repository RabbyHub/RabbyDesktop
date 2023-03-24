import { useAccountToDisplay } from '@/renderer/hooks/rabbyx/useAccountToDisplay';
import { isSameAddress } from '@/renderer/utils/address';
import { KEYRING_TYPE } from '@/renderer/utils/constant';
import classNames from 'classnames';
import React from 'react';
import { RabbyButton } from '../Button/RabbyButton';
import { Modal } from '../Modal/Modal';
import { AddressItem } from './AddressItem';
import styles from './style.module.less';

export interface Props {
  open: boolean;
  onCancel(): void;
  networkId: string;
  onConfirm(account: IDisplayedAccountWithBalance): void;
  submitting?: boolean;
}

export const SelectAddressModal: React.FC<Props> = ({
  open,
  onCancel,
  networkId,
  onConfirm,
  submitting,
}) => {
  const { getAllAccountsToDisplay, accountsList } = useAccountToDisplay();
  const [selectAccount, setSelectedAccount] =
    React.useState<IDisplayedAccountWithBalance>();

  React.useEffect(() => {
    getAllAccountsToDisplay();
  }, [getAllAccountsToDisplay]);

  const accounts = React.useMemo(() => {
    return accountsList.filter(
      (item) => item.type !== KEYRING_TYPE.GnosisKeyring
    );
  }, [accountsList]);

  const handleConfirm = React.useCallback(() => {
    if (selectAccount) {
      onConfirm(selectAccount);
    }
  }, [onConfirm, selectAccount]);

  return (
    <Modal
      width={500}
      open={open}
      onCancel={onCancel}
      centered
      title={
        <div className="text-[22px] px-[30px]">
          You can submit this transaction using any address
        </div>
      }
    >
      <div>
        <section
          className={classNames(
            'flex gap-[14px] flex-col',
            'px-[20px] h-max-[470px] overflow-y-auto',
            styles.scrollbar
          )}
        >
          {accounts.map((account) => (
            <AddressItem
              selected={
                selectAccount?.address
                  ? isSameAddress(selectAccount.address, account.address)
                  : false
              }
              onClick={setSelectedAccount}
              key={account.address}
              data={account}
              networkId={networkId}
            />
          ))}
        </section>

        <div className="p-[20px] flex gap-[20px]">
          <RabbyButton
            onClick={onCancel}
            className="flex-1 rounded-[6px] h-[44px]"
          >
            Cancel
          </RabbyButton>
          <RabbyButton
            disabled={!selectAccount}
            className="flex-1 rounded-[6px] h-[44px]"
            onClick={handleConfirm}
            loading={submitting}
          >
            Sign
          </RabbyButton>
        </div>
      </div>
    </Modal>
  );
};
