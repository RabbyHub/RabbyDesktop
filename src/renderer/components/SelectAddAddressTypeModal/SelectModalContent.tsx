import { IS_RUNTIME_PRODUCTION } from '@/isomorphic/constants';
import {
  KEYRING_CLASS,
  WALLET_BRAND_CONTENT,
  WALLET_BRAND_TYPES,
} from '@/renderer/utils/constant';
import React from 'react';
import { ContactTypeCard } from './ContactCard';
import styles from './index.module.less';
import { ContactTypeCardList } from './ContactCardList';

const HARDWARE_MAP = [
  {
    logo: 'rabby-internal://assets/icons/device/ledger.svg',
    name: 'Ledger',
    id: KEYRING_CLASS.HARDWARE.LEDGER,
  },
  {
    logo: 'rabby-internal://assets/icons/device/trezor.svg',
    name: 'Trezor',
    id: KEYRING_CLASS.HARDWARE.TREZOR,
  },
  {
    logo: 'rabby-internal://assets/icons/device/onekey.svg',
    name: 'OneKey',
    id: KEYRING_CLASS.HARDWARE.ONEKEY,
  },
  {
    logo: 'rabby-internal://assets/icons/device/keystone.svg',
    name: 'Keystone',
    id: KEYRING_CLASS.HARDWARE.KEYSTONE,
  },
];

const WALLETCONNECT_BRANDS = [
  WALLET_BRAND_CONTENT.MetaMask,
  WALLET_BRAND_CONTENT.TRUSTWALLET,
  WALLET_BRAND_CONTENT.TP,
  WALLET_BRAND_CONTENT.IMTOKEN,
  WALLET_BRAND_CONTENT.MATHWALLET,
  WALLET_BRAND_CONTENT.Rainbow,
  WALLET_BRAND_CONTENT.Bitkeep,
  WALLET_BRAND_CONTENT.Zerion,
  WALLET_BRAND_CONTENT.WalletConnect,
];

const WALLETCONNECT_MAP = WALLETCONNECT_BRANDS.map((item) => ({
  logo: item.icon,
  name: item.name,
  id: item.brand,
  bridge:
    item.name === WALLET_BRAND_CONTENT.WalletConnect.name
      ? undefined
      : WALLET_BRAND_CONTENT.WalletConnect.icon,
}));

interface Props {
  onSelectType: (type: string, brand?: WALLET_BRAND_TYPES) => void;
}

export const SelectModalContent: React.FC<Props> = ({ onSelectType }) => {
  return (
    <div className={styles.SelectModalContent}>
      <ContactTypeCardList
        logo="rabby-internal://assets/icons/add-address/device.svg"
        title="Connect Hardware Wallets"
        list={HARDWARE_MAP}
        onAction={onSelectType}
      />

      <ContactTypeCardList
        logo="rabby-internal://assets/icons/add-address/walletconnect.svg"
        title="Connect Mobile Wallet Apps"
        list={WALLETCONNECT_MAP}
        onAction={(brand) =>
          onSelectType(KEYRING_CLASS.WALLETCONNECT, brand as WALLET_BRAND_TYPES)
        }
      />

      <ContactTypeCard
        logo="rabby-internal://assets/icons/walletlogo/gnosis.svg"
        title="Safe"
        onAction={() => onSelectType(KEYRING_CLASS.GNOSIS)}
      />

      <ContactTypeCard
        logo="rabby-internal://assets/icons/add-address/cup.svg"
        title="Add Contacts"
        subtitle="You can also use it as a watch-only address"
        onAction={() => onSelectType(KEYRING_CLASS.WATCH)}
      />

      {!IS_RUNTIME_PRODUCTION && (
        <ContactTypeCard
          logo="rabby-internal://assets/icons/add-address/privatekey.svg"
          title="Import Private Key"
          onAction={() => onSelectType(KEYRING_CLASS.PRIVATE_KEY)}
        />
      )}
    </div>
  );
};
