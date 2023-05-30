import React from 'react';
import {
  WALLET_BRAND_CONTENT,
  WALLET_BRAND_TYPES,
} from '@/renderer/utils/constant';
import { Modal, Props as ModalProps } from '../Modal/Modal';
import { SuccessContent } from '../SelectAddAddressTypeModal/SuccessContent';
import { WalletConnectModalContent } from './WalletConnectModalContent';

type Account = import('@/isomorphic/types/rabbyx').Account;

interface Props extends ModalProps {
  onSuccess: () => void;
  brand: WALLET_BRAND_TYPES;
}

const WalletConnectName = WALLET_BRAND_CONTENT.WalletConnect?.name;

export const WalletConnectModal: React.FC<Props> = ({
  onSuccess,
  brand,
  ...props
}) => {
  const [result, setResult] = React.useState<Account[]>();
  let brandName = WALLET_BRAND_CONTENT[brand].name;
  brandName = brandName === WalletConnectName ? 'Mobile Wallet' : brandName;

  if (result) {
    return (
      <Modal open={props.open} centered smallTitle onCancel={onSuccess}>
        <SuccessContent
          title="Connected successfully"
          onSuccess={onSuccess}
          accounts={result ?? []}
        />
      </Modal>
    );
  }

  return (
    <Modal
      {...props}
      title={`Connect your ${brandName}`}
      subtitle={
        <span className="text-[15px] opacity-80">Via Wallet Connect</span>
      }
    >
      <WalletConnectModalContent brand={brand} onSuccess={setResult} />
    </Modal>
  );
};
