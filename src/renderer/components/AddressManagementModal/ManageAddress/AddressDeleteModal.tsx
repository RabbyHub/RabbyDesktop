import { useWalletConnectIcon } from '@/renderer/hooks/useWalletConnectIcon';
import {
  KEYRING_ICONS,
  WALLET_BRAND_CONTENT,
  BRAND_ALIAN_TYPE_TEXT,
} from '@/renderer/utils/constant';
import { Button } from 'antd';
import { useMemo } from 'react';
import Popup from '../../Popup';
import styles from './style.module.less';

type DelectModalProps = {
  visible: boolean;
  onClose(): void;
  onSubmit(): void;
};
export const AddressDeleteModal = ({
  visible,
  onClose,
  onSubmit,
  item,
  count,
}: DelectModalProps & {
  item: IDisplayedAccountWithBalance;
  count: number;
}) => {
  const { address, brandName, type } = item;
  const brandIcon = useWalletConnectIcon({
    address,
    brandName,
    type,
  });

  const addressTypeIcon = useMemo(
    () =>
      brandIcon ||
      KEYRING_ICONS[type] ||
      WALLET_BRAND_CONTENT[brandName as keyof typeof WALLET_BRAND_CONTENT]
        ?.image,
    [type, brandName, brandIcon]
  );
  const renderBrand = useMemo(() => {
    if (
      brandName &&
      WALLET_BRAND_CONTENT[brandName as keyof typeof WALLET_BRAND_CONTENT]
    ) {
      return WALLET_BRAND_CONTENT[
        brandName as keyof typeof WALLET_BRAND_CONTENT
      ].name;
    }

    if (BRAND_ALIAN_TYPE_TEXT[type]) {
      return BRAND_ALIAN_TYPE_TEXT[type];
    }
    return type;
  }, [brandName, type]);

  return (
    <Popup
      open={visible}
      title={null}
      height={220}
      onClose={onClose}
      getContainer={false}
      placement="bottom"
      push={false}
      className={styles.addressDeleteModal}
    >
      <div className="flex items-center relative w-[48px] h-[48px] mx-auto">
        <img src={addressTypeIcon} className="w-[48px] h-[48px]" />
        <img
          src="rabby-internal://assets/icons/address-management/delete.svg"
          className="absolute -bottom-4 -right-4"
        />
      </div>
      <div className="text-center mt-20 mb-[40px]  text-20 font-medium h-[22px]">
        Delete {count} {renderBrand} {count > 1 ? 'addresses' : 'address'}
      </div>
      <footer className="flex gap-[16px]">
        <Button
          type="primary"
          size="large"
          block
          onClick={onClose}
          className={styles.btn}
        >
          Cancel
        </Button>
        <Button
          onClick={onSubmit}
          type="primary"
          ghost
          size="large"
          className={styles.btn}
          block
        >
          Confirm Delete
        </Button>
      </footer>
    </Popup>
  );
};
