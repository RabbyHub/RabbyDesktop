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
import { RcIconChecked } from '@/../assets/icons/select-camera';
import { IS_RUNTIME_PRODUCTION } from '@/isomorphic/constants';
import { useSelectedMedieDevice } from '@/renderer/hooks/useSettings';
import styles from './index.module.less';

hideMainwinPopupview('select-camera');

function useSelectCamera() {
  const [cameraList, setCameraList] = useState<MediaDeviceInfo[]>([]);

  const {
    selectedMediaConstrains,
    setLocalConstrains,
    fetchSelectedMediaConstrains,
  } = useSelectedMedieDevice();

  const { localVisible, hideView, pageInfo } = usePopupViewInfo(
    'select-camera',
    {
      enableTopViewGuard: true,
      onVisibleChanged: async (visible) => {
        if (visible) {
          fetchSelectedMediaConstrains();
          try {
            const { mediaList: allCameras } =
              await window.rabbyDesktop.ipcRenderer.invoke(
                'enumerate-camera-devices'
              );
            // const allCameras = await window.navigator.mediaDevices
            //   .enumerateDevices()
            //   .then((result) =>
            //     result.filter((item) => item.kind === 'videoinput')
            //   );

            setCameraList(allCameras || []);
          } catch (err) {
            console.error(err);
            setCameraList([]);
          }
        }
      },
    }
  );

  const confirmSelectDevice = useCallback(
    (selectId: string) => {
      if (!selectedMediaConstrains?.label) {
        throw new Error('No camera selected');
      }

      window.rabbyDesktop.ipcRenderer.invoke('confirm-selected-camera', {
        selectId,
        constrains: selectedMediaConstrains,
      });
    },
    [selectedMediaConstrains]
  );

  const cancelSelect = useCallback(() => {
    // if (selectId !== undefined) {
    //   window.rabbyDesktop.ipcRenderer.invoke('confirm-selected-camera', {
    //     selectId,
    //     deviceId: null,
    //   });
    // }
    hideView();
  }, [hideView]);

  useEffect(() => {
    if (!localVisible) {
      setCameraList([]);
      setLocalConstrains(null);
    }
  }, [setLocalConstrains, localVisible]);

  return {
    selectedMediaConstrains,
    setLocalConstrains,

    confirmSelectDevice,
    cancelSelect,

    cameraList,
    localVisible,
    // TODO: report close event to main process
    hideView,
    pageInfo,
  };
}

function SelectCameraModal() {
  useBodyClassNameOnMounted('select-camera-popup');
  const {
    selectedMediaConstrains,
    setLocalConstrains,
    confirmSelectDevice,
    cancelSelect,

    cameraList,
    localVisible,
    pageInfo,
  } = useSelectCamera();

  if (!localVisible || !pageInfo?.state) return null;

  const pageState = pageInfo.state;

  if (!IS_RUNTIME_PRODUCTION) {
    console.debug('[debug] SelectCameraModal:: cameraList', cameraList);
  }

  return (
    <div className={styles.SelectCameraModalWrapper}>
      <RModal
        className={styles.SelectCameraModal}
        open={localVisible}
        centered
        mask
        maskClosable={false}
        width={1000}
        title="Select Camera"
        onCancel={() => {
          cancelSelect();
        }}
      >
        <div className={styles.SelectDevicesContent}>
          {cameraList?.length ? (
            <div className={styles.cameras}>
              <h3 className={styles.title}>
                The following{' '}
                {cameraList?.length > 1 ? 'cameras are' : 'camera is'} found
              </h3>
              <div className={styles.list}>
                {cameraList.map((d) => {
                  const isSelected =
                    selectedMediaConstrains?.label &&
                    selectedMediaConstrains?.label === d.label;
                  return (
                    <div
                      key={`${pageState.selectId}-camera-${d.deviceId}`}
                      className={classNames(
                        styles.camera,
                        isSelected && styles.selected
                      )}
                      onClick={() => {
                        if (!isSelected) {
                          setLocalConstrains({ label: d.label });
                        } else {
                          setLocalConstrains(null);
                        }
                      }}
                    >
                      <div className={classNames(styles.deviceInfo, 'flex')}>
                        <img
                          className={classNames(styles.icon, 'mr-[8px]')}
                          src="rabby-internal://assets/icons/select-camera/camera.svg"
                        />
                        <span>{d.label}</span>
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
                  className={classNames(styles.icon, 'block')}
                  src="rabby-internal://assets/icons/select-camera/no-camera.svg"
                />
                <p className={styles.text}>Camera not found</p>
              </div>
            </div>
          )}
          <Button
            disabled={!cameraList.length || !selectedMediaConstrains?.label}
            className={styles.next}
            type="primary"
            onClick={() => {
              confirmSelectDevice(pageState.selectId);
            }}
          >
            Next
          </Button>
        </div>
      </RModal>
    </div>
  );
}

const router = createRouter([
  {
    path: '/',
    id: 'select-camera-mngr',
    element: <SelectCameraModal />,
  },
  {
    path: '*',
    element: <Navigate to="/" />,
  },
]);

export default function SelectCameraWindow() {
  return <RouterProvider router={router} />;
}
