import { IS_RUNTIME_PRODUCTION } from '@/isomorphic/constants';
import {
  KEYRING_CLASS,
  WALLET_BRAND_CONTENT,
  WALLET_BRAND_TYPES,
} from '@/renderer/utils/constant';
import React from 'react';
import { useTrezorLikeAvailablity } from '@/renderer/hooks-ipc/useTrezorLike';
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
    brand: WALLET_BRAND_CONTENT.Keystone.brand,
  },
  {
    logo: 'rabby-internal://assets/icons/device/airgap.svg',
    name: 'AirGap Vault',
    id: KEYRING_CLASS.HARDWARE.KEYSTONE,
    brand: WALLET_BRAND_CONTENT.AirGap.brand,
  },
  {
    logo: 'rabby-internal://assets/icons/device/coolwallet.svg',
    name: 'CoolWallet',
    id: KEYRING_CLASS.HARDWARE.KEYSTONE,
    brand: WALLET_BRAND_CONTENT.CoolWallet.brand,
  },
  {
    logo: 'rabby-internal://assets/icons/device/gridplus.svg',
    name: 'GridPlus',
    id: KEYRING_CLASS.HARDWARE.GRIDPLUS,
  },
];

const WALLETCONNECT_BRANDS = [
  WALLET_BRAND_CONTENT.MetaMask,
  WALLET_BRAND_CONTENT.TRUSTWALLET,
  WALLET_BRAND_CONTENT.TP,
  WALLET_BRAND_CONTENT.IMTOKEN,
  WALLET_BRAND_CONTENT.MATHWALLET,
  WALLET_BRAND_CONTENT.Rainbow,
  WALLET_BRAND_CONTENT.Bitget,
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
  const { trezorLikeAvailability, requestAlertIfCannotUse } =
    useTrezorLikeAvailablity({
      openFromAddAddressModal: true,
    });

  const { trezorItem, onekeyItem, hardwareMap } = React.useMemo(() => {
    const result = {
      trezorItem: trezorLikeAvailability.find(
        (item) => item.cannotUse === 'trezor'
      ),
      onekeyItem: trezorLikeAvailability.find(
        (item) => item.cannotUse === 'onekey'
      ),
      hardwareMap: HARDWARE_MAP,
    };
    if (!trezorLikeAvailability?.length) return result;

    result.hardwareMap = result.hardwareMap.map((item) => {
      if (
        (item.id === KEYRING_CLASS.HARDWARE.TREZOR &&
          result.trezorItem?.reasonType === 'enabled-ipfs') ||
        (item.id === KEYRING_CLASS.HARDWARE.ONEKEY &&
          result.onekeyItem?.reasonType === 'enabled-ipfs')
      ) {
        return {
          ...item,
          isDisabledTrezorLike: true,
        };
      }

      return item;
    });

    return result;
  }, [trezorLikeAvailability]);

  return (
    <div className={styles.SelectModalContent}>
      <ContactTypeCardList
        logo="rabby-internal://assets/icons/add-address/device.svg"
        title="Connect Hardware Wallets"
        list={hardwareMap}
        onAction={(type, brand) => {
          if (
            type === KEYRING_CLASS.HARDWARE.TREZOR &&
            trezorItem?.reasonType === 'enabled-ipfs'
          ) {
            requestAlertIfCannotUse('trezor');
            return;
          }
          if (
            type === KEYRING_CLASS.HARDWARE.ONEKEY &&
            onekeyItem?.reasonType === 'enabled-ipfs'
          ) {
            requestAlertIfCannotUse('onekey');
            return;
          }
          onSelectType(type, brand);
        }}
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
