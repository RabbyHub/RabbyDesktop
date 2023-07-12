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
import { APP_BRANDNAME, IS_RUNTIME_PRODUCTION } from '@/isomorphic/constants';
import { useSelectedMedieDevice } from '@/renderer/hooks/useSettings';
import { useInterval } from '@/renderer/hooks/useTimer';
import { usePrevious } from 'react-use';
import { detectClientOS } from '@/isomorphic/os';
import styles from './index.module.less';

hideMainwinPopupview('select-camera');

const IS_DARWIN = detectClientOS() === 'darwin';
function useSelectCamera() {
  const {
    cameraAccessStatus,
    selectedMediaConstrains,
    setLocalConstrains,
    fetchSelectedMediaConstrains,
    fetchCameraAccessStatus,
  } = useSelectedMedieDevice();

  const [cameraList, setCameraList] = useState<MediaDeviceInfo[]>([]);
  const fetchCameraList = useCallback(async () => {
    try {
      const { mediaList: allCameras } =
        await window.rabbyDesktop.ipcRenderer.invoke(
          'enumerate-camera-devices'
        );

      setCameraList(allCameras || []);
    } catch (err) {
      console.error(err);
      setCameraList([]);
    }
  }, []);

  const { localVisible, hideView, pageInfo } = usePopupViewInfo(
    'select-camera',
    {
      enableTopViewGuard: true,
      onVisibleChanged: async (visible) => {
        if (visible) {
          const result = await fetchCameraAccessStatus();
          if (result.cameraAccessStatus === 'granted') {
            fetchSelectedMediaConstrains();
            fetchCameraList();
          }
        }
      },
    }
  );

  const previousCameraAccessStatus = usePrevious(cameraAccessStatus);
  // useEffect(() => {
  //   if (!localVisible) return;
  //   if (
  //     previousCameraAccessStatus !== 'granted' &&
  //     cameraAccessStatus === 'granted'
  //   ) {
  //     fetchSelectedMediaConstrains();
  //     fetchCameraList();
  //     // window.rabbyDesktop.ipcRenderer.invoke(
  //     //   'app-relaunch',
  //     //   'media-access-updated'
  //     // );
  //   }
  // }, [localVisible, previousCameraAccessStatus, cameraAccessStatus]);

  useInterval(async () => {
    const result = await fetchCameraAccessStatus();
    if (
      previousCameraAccessStatus !== 'granted' &&
      result.cameraAccessStatus === 'granted'
    ) {
      fetchSelectedMediaConstrains();
      fetchCameraList();
    }
  }, 1000);

  const confirmSelectDevice = useCallback(
    (selectId: string) => {
      if (!selectedMediaConstrains?.label) {
        throw new Error('No camera selected');
      }

      window.rabbyDesktop.ipcRenderer.invoke('finish-select-camera', {
        selectId,
        constrains: selectedMediaConstrains,
      });
    },
    [selectedMediaConstrains]
  );

  const cancelSelect = useCallback(
    (selectId: string) => {
      if (selectId !== undefined) {
        window.rabbyDesktop.ipcRenderer.invoke('finish-select-camera', {
          selectId,
          constrains: selectedMediaConstrains,
          isCanceled: true,
        });
      }
      hideView();
    },
    [selectedMediaConstrains, hideView]
  );

  useEffect(() => {
    if (!localVisible) {
      setCameraList([]);
      setLocalConstrains(null);
    }
  }, [setLocalConstrains, localVisible]);

  return {
    cameraAccessStatus,
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

function TipGoToGrantOnDarwin() {
  return (
    <div className={styles.TipGoToGrantOnDarwin}>
      <div className={styles.alertContent}>
        Please allow camera access to proceed
      </div>

      <div
        className={classNames(
          styles.steps,
          IS_DARWIN ? styles.stepsMacOS : styles.stepsWindows
        )}
      >
        {IS_DARWIN && (
          <>
            <div className={classNames(styles.step, styles.step1)}>
              <img
                className="w-[380px]"
                src="rabby-internal://assets/imgs/tip-grant-camera/macos-tip-step1.png"
              />
              <p className={styles.desc}>
                1. Go to System Settings - Privacy & Security - Camera
              </p>
            </div>
            <img
              className={styles.stepArrow}
              src="rabby-internal://assets/imgs/tip-grant-camera/step-arrow.svg"
            />
            <div className={classNames(styles.step, styles.step2)}>
              <img
                className="w-[440px]"
                src="rabby-internal://assets/imgs/tip-grant-camera/macos-tip-step2.png"
              />
              <p className={styles.desc}>
                2. Allow {APP_BRANDNAME} to access camera, restart the app
              </p>
            </div>
          </>
        )}

        {!IS_DARWIN && (
          <>
            <div className={classNames(styles.step, styles.step1)}>
              <img
                className="w-[380px]"
                src="rabby-internal://assets/imgs/tip-grant-camera/windows-tip-step1.png"
              />
              <p className={styles.desc}>
                1. Go to System Settings - Privacy & Security - Camera
              </p>
            </div>
            <img
              className={styles.stepArrow}
              src="rabby-internal://assets/imgs/tip-grant-camera/step-arrow.svg"
            />
            <div className={classNames(styles.step, styles.step2)}>
              <img
                className="w-[440px]"
                src="rabby-internal://assets/imgs/tip-grant-camera/windows-tip-step2.png"
              />
              <p className={styles.desc}>
                {`2. Make sure "Camera access" > "Let apps access your camera" > "Let desktop apps access your camera" Enabled`}
              </p>
            </div>
          </>
        )}

        <Button
          className={styles.next}
          type="primary"
          onClick={() => {
            window.rabbyDesktop.ipcRenderer.invoke(
              'redirect-to-setting-privacy-camera'
            );
          }}
        >
          Go to grant
        </Button>
      </div>
    </div>
  );
}

function SelectCameraModal() {
  useBodyClassNameOnMounted('select-camera-popup');
  const {
    cameraAccessStatus,
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
          cancelSelect(pageState.selectId);
        }}
      >
        <div className={styles.SelectDevicesContent}>
          {cameraAccessStatus === 'denied' && <TipGoToGrantOnDarwin />}
          {cameraAccessStatus === 'granted' && (
            <>
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
                          <div
                            className={classNames(styles.deviceInfo, 'flex')}
                          >
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
                disabled={
                  cameraAccessStatus !== 'granted' ||
                  !cameraList.length ||
                  !selectedMediaConstrains?.label
                }
                className={styles.next}
                type="primary"
                onClick={() => {
                  confirmSelectDevice(pageState.selectId);
                }}
              >
                Next
              </Button>
            </>
          )}
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
