import {
  KEYRING_TYPE,
  KEYRING_TYPE_TEXT,
  WALLET_BRAND_CONTENT,
  WALLET_BRAND_TYPES,
} from '@/renderer/utils/constant';

export const useAddressSource = ({
  type,
  brandName,
  byImport = false,
}: {
  type: string;
  brandName: WALLET_BRAND_TYPES;
  byImport?: boolean;
}) => {
  if (byImport === true && KEYRING_TYPE.HdKeyring === type) {
    return 'Imported by Seed Phrase';
  }
  if (KEYRING_TYPE_TEXT[type]) {
    return KEYRING_TYPE_TEXT[type];
  }
  if (WALLET_BRAND_CONTENT[brandName]) {
    return WALLET_BRAND_CONTENT[brandName].name;
  }
  return '';
};
