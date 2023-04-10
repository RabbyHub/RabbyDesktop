import { SuccessContent } from '@/renderer/components/SelectAddAddressTypeModal/SuccessContent';
import clsx from 'clsx';
import React from 'react';
import { ellipsis } from '@/renderer/utils/address';
import { Modal, Props as ModalProps } from '@/renderer/components/Modal/Modal';
import { useAccountItemAddress, useAccountItemIcon } from './useAccountItem';
import { NicknameInput } from './NicknameInput';

export interface Props extends ModalProps {
  data: BundleAccount;
}

export const BundleSuccessModal: React.FC<Props> = ({ data, ...props }) => {
  const iconUrl = useAccountItemIcon(data);
  const address = useAccountItemAddress(data);
  const { onCancel } = props;

  return (
    <Modal centered {...props}>
      <SuccessContent onSuccess={() => onCancel?.()}>
        <div
          className={clsx(
            'rounded-[8px] bg-[#FFFFFF1A]',
            'px-[20px] py-[15px]',
            'flex w-[500px] items-center space-x-[13px]'
          )}
        >
          <img className="w-[26px] h-[26px]" src={iconUrl} />
          <div className="text-white text-left">
            <NicknameInput data={data} canEdit />
            <span className="text-[13px] opacity-60">{ellipsis(address)}</span>
          </div>
        </div>
      </SuccessContent>
    </Modal>
  );
};
