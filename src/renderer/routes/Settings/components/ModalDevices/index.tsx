import { Modal as RabbyModal } from '@/renderer/components/Modal/Modal';
import { Tabs } from 'antd';

import { useState } from 'react';
import { IS_RUNTIME_PRODUCTION } from '@/isomorphic/constants';
import { useIsViewingDevices } from '../../settingHooks';
import DeviceViewHID from './DeviceViewHID';
import DeviceViewUSB from './DeviceViewUSB';
import styles from './index.module.less';
import { IPerspective } from './useFilteredDevices';

export default function ModalDevices() {
  const [currentPerspective, setCurrentPerspective] =
    useState<IPerspective>('hid');
  const { isViewingDevices, setIsViewingDevices } = useIsViewingDevices();

  return (
    <RabbyModal
      className={styles.modalDevicesModal}
      visible={isViewingDevices}
      width={1000}
      onCancel={() => {
        setIsViewingDevices(false);
      }}
    >
      <h2 className={styles['form-title']}>
        {currentPerspective.toUpperCase()} Devices List
      </h2>

      <Tabs
        className={styles.tabs}
        items={[
          {
            label: <span className={styles.tabLabel}>HID</span>,
            key: 'hid',
            children: <DeviceViewHID />,
          },
          !IS_RUNTIME_PRODUCTION &&
            ({
              label: <span className={styles.tabLabel}>USB</span>,
              key: 'usb',
              children: <DeviceViewUSB />,
            } as any),
        ].filter(Boolean)}
        activeKey={currentPerspective}
        onChange={(activeKey: string) => {
          setCurrentPerspective(activeKey as IPerspective);
        }}
      />
    </RabbyModal>
  );
}
