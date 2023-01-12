import { AddressManagementDrawer } from '@/renderer/components/AddressManagementDrawer/AddressManagementDrawer';
import { useResetToCurrentPage } from '@/renderer/components/PopupViewUtils';
import { hideMainwinPopupview } from '@/renderer/ipcRequest/mainwin-popupview';
import styles from './index.module.less';

export default function MainWindowAddressManagement() {
  const resetPage = useResetToCurrentPage();

  return (
    <div className={styles.MainWindowAddressManagement}>
      <AddressManagementDrawer
        visible
        onClose={() => {
          hideMainwinPopupview('address-management');
          resetPage();
        }}
      />
    </div>
  );
}
