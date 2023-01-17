import { Modal as RabbyModal } from '@/renderer/components/Modal/Modal';
import { useOSInfo } from '@/renderer/hooks/useMainBridge';
import { Tabs } from 'antd';

import { useState } from 'react';
import { useIsViewingDevices } from '../../settingHooks';
import DeviceViewHID from './DeviceViewHID';
import DeviceViewUSB from './DeviceViewUSB';
import styles from './index.module.less';
import { IPerspective } from './useFilteredDevices';

export default function ModalDevices() {
  const [currentPerspective, setCurrentPerspective] =
    useState<IPerspective>('usb');
  const { isViewingDevices, setIsViewingDevices } = useIsViewingDevices();
  const osInfo = useOSInfo();

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
            label: <span className={styles.tabLabel}>USB</span>,
            key: 'usb',
            children: <DeviceViewUSB />,
          },
        ].concat(
          osInfo && osInfo.platform !== 'darwin' && osInfo.arch !== 'arm64'
            ? {
                label: <span className={styles.tabLabel}>HID</span>,
                key: 'hid',
                children: <DeviceViewHID />,
              }
            : []
        )}
        activeKey={currentPerspective}
        onChange={(activeKey: string) => {
          setCurrentPerspective(activeKey as IPerspective);
        }}
      />
    </RabbyModal>
  );
}
