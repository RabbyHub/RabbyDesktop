import { AddAddressModal } from '@/renderer/components/AddAddressModal/AddAddressModal';
import { useResetToCurrentPage } from '@/renderer/components/PopupViewUtils';
import { hideMainwinPopupview } from '@/renderer/ipcRequest/mainwin-popupview';
import styles from './index.module.less';

export default function MainWindowAddAddress() {
  const resetPage = useResetToCurrentPage();

  return (
    <div className={styles.MainWindowAddAddress}>
      <AddAddressModal
        visible
        onClose={() => {
          hideMainwinPopupview('add-address');
          resetPage();
        }}
      />
    </div>
  );
}
