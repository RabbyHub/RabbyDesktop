import { useCallback, useEffect, useState } from 'react';
import {
  createHashRouter as createRouter,
  RouterProvider,
  Navigate,
} from 'react-router-dom';
import { Button } from 'antd';
import classNames from 'classnames';

import { usePopupViewInfo } from '@/renderer/hooks/usePopupWinOnMainwin';
import { useBodyClassNameOnMounted } from '@/renderer/hooks/useMountedEffect';
import { Modal as RModal } from '@/renderer/components/Modal/Modal';
import { hideMainwinPopupview } from '@/renderer/ipcRequest/mainwin-popupview';
import { RcIconChecked } from '@/../assets/icons/select-devices';
import { IS_RUNTIME_PRODUCTION } from '@/isomorphic/constants';
import styles from './index.module.less';

hideMainwinPopupview('select-devices');

function useHidSelectDevice() {
  const { localVisible, hideView, pageInfo } = usePopupViewInfo(
    'select-devices',
    { enableTopViewGuard: true }
  );
  const [deviceList, setDeviceList] = useState<IMergedHidDevice[]>([]);

  const [selectedDevice, setSelectedDevice] = useState<IHidDevice | null>(null);

  const confirmSelectDevice = useCallback(
    (selectId: string) => {
      if (!selectedDevice) {
        throw new Error('No device selected');
      }

      window.rabbyDesktop.ipcRenderer.invoke('confirm-selected-device', {
        selectId,
        device: {
          deviceId: selectedDevice.deviceId,
          vendorId: selectedDevice.vendorId,
          productId: selectedDevice.productId,
        },
      });
    },
    [selectedDevice]
  );

  const cancelSelect = useCallback(
    (selectId: string) => {
      window.rabbyDesktop.ipcRenderer.invoke('confirm-selected-device', {
        selectId,
        device: null,
      });
      hideView();
    },
    [hideView]
  );

  useEffect(() => {
    return window.rabbyDesktop.ipcRenderer.on(
      '__internal_push:webhid:select-list',
      (event) => {
        setDeviceList(event.deviceList);
      }
    );
  }, []);

  useEffect(() => {
    if (!localVisible) {
      setDeviceList([]);
      setSelectedDevice(null);
    }
  }, [localVisible]);

  return {
    selectedDevice,
    setSelectedDevice,

    confirmSelectDevice,
    cancelSelect,

    deviceList,
    localVisible,
    // TODO: report close event to main process
    hideView,
    pageInfo,
  };
}

function SelectDeviceModal() {
  useBodyClassNameOnMounted('select-devices-popup');
  const {
    selectedDevice,
    setSelectedDevice,
    confirmSelectDevice,
    cancelSelect,

    deviceList,
    localVisible,
    pageInfo,
  } = useHidSelectDevice();

  if (!localVisible || !pageInfo?.state) return null;

  const pageState = pageInfo.state;

  if (!IS_RUNTIME_PRODUCTION) {
    console.debug('[debug] SelectDeviceModal:: deviceList', deviceList);
  }

  return (
    <div className={styles.MainWindowAddAddress}>
      <RModal
        className={styles.SelectDevicesModal}
        open={localVisible}
        centered
        mask={false}
        width={1000}
        title="Connect Ledger"
        onCancel={() => {
          cancelSelect(pageState.selectId);
        }}
      >
        <div className={styles.SelectDevicesContent}>
          {deviceList?.length ? (
            <div className={styles.devices}>
              <h3 className={styles.title}>
                The following {deviceList?.length > 1 ? 'devices' : 'device'} is{' '}
                found
              </h3>
              <div className={styles.list}>
                {deviceList.map((d) => {
                  const isSelected = selectedDevice?.deviceId === d.deviceId;
                  return (
                    <div
                      key={`${pageState.selectId}-device-${d.deviceId}}`}
                      className={classNames(
                        styles.device,
                        isSelected && styles.selected
                      )}
                      onClick={() => {
                        if (!isSelected) {
                          setSelectedDevice(d);
                        } else {
                          setSelectedDevice(null);
                        }
                      }}
                    >
                      <div className={classNames(styles.deviceInfo, 'flex')}>
                        <img
                          className={styles.icon}
                          src="rabby-internal://assets/icons/select-devices/device.svg"
                        />
                        <span>{d.name}</span>
                      </div>

                      <RcIconChecked className={styles.checkIcon} />
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className={styles.errorContainer}>
              <div className={styles.error}>
                <img
                  className={styles.icon}
                  src="rabby-internal://assets/icons/select-devices/warning.svg"
                />
                <span className={styles.text}>
                  Hardware wallet not detected
                </span>
              </div>
            </div>
          )}
          <div className={styles.tipsContainer}>
            <ol className={styles.tips}>
              <li>Plug your Hardware wallet into your computer</li>
              <li>Unlock Hardware wallet and open the Ethereum app</li>
            </ol>
          </div>
          <Button
            disabled={!deviceList.length || !selectedDevice?.deviceId}
            className={styles.next}
            type="primary"
            onClick={() => {
              confirmSelectDevice(pageState.selectId);
            }}
          >
            Select Device
          </Button>
        </div>
      </RModal>
    </div>
  );
}

const router = createRouter([
  {
    path: '/',
    id: 'addr-mngr',
    element: <SelectDeviceModal />,
  },
  {
    path: '*',
    element: <Navigate to="/" />,
  },
]);

export default function SelectDevicesWindow() {
  return <RouterProvider router={router} />;
}
