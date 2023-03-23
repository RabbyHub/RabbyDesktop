import { IS_RUNTIME_PRODUCTION } from '@/isomorphic/constants';
import { KEYRING_CLASS } from '@/renderer/utils/constant';

interface KeyringLabel {
  logo: string;
  name: string;
  id: string;
}

const KEYRING_MAP: KeyringLabel[] = [
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
    logo: 'rabby-internal://assets/icons/add-address/walletconnect.svg',
    name: 'Wallet Connect',
    id: KEYRING_CLASS.WALLETCONNECT,
  },
  {
    logo: 'rabby-internal://assets/icons/add-address/cup.svg',
    name: 'Contacts',
    id: KEYRING_CLASS.WATCH,
  },
  {
    logo: 'rabby-internal://assets/icons/walletlogo/gnosis.svg',
    name: 'Safe',
    id: KEYRING_CLASS.GNOSIS,
  },
];

if (!IS_RUNTIME_PRODUCTION) {
  KEYRING_MAP.push({
    logo: 'rabby-internal://assets/icons/add-address/privatekey.svg',
    name: 'Private Key',
    id: KEYRING_CLASS.PRIVATE_KEY,
  });
}
export function getAddDropdownKeyrings() {
  return KEYRING_MAP;
}

export const ADD_DROPDOWN_LEFT_OFFSET = 30;
