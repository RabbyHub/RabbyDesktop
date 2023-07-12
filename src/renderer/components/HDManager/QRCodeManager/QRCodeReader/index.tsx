import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { BrowserQRCodeReader } from '@zxing/browser';
import './style.less';
import clsx from 'clsx';
import { toastTopMessage } from '@/renderer/ipcRequest/mainwin-popupview';

import classNames from 'classnames';
import RcLoading from './loading.svg?rc';

interface QRCodeReaderProps {
  onSuccess(text: string): void;
  onError?(): void;
  width?: number;
  height?: number;
  className?: string;
}

const QRCodeReader = ({
  onSuccess,
  onError,
  width = 100,
  height = 100,
  className,
}: QRCodeReaderProps) => {
  const [canplay, setCanplay] = useState(false);
  const codeReader = useMemo(() => {
    return new BrowserQRCodeReader();
  }, []);
  const [deviceId, setDeviceId] = useState<string | null>();
  const findDevices = useCallback(async () => {
    const devices = await window.navigator.mediaDevices.enumerateDevices();
    const videoDevices = devices.filter(
      (device) => device.kind === 'videoinput'
    );
    const {
      constrains,
      isCanceled,
      prevCameraAccessStatus,
      cameraAccessStatus,
    } = await window.rabbyDesktop.ipcRenderer.invoke('start-select-camera', {
      forceUserSelect: false,
    });

    /**
     * conditions would be true ONLY on:
     * 1. Windows 10+
     * 2. macOS, launched from Terminal on development
     */
    if (
      cameraAccessStatus === 'granted' &&
      prevCameraAccessStatus !== cameraAccessStatus
    ) {
      toastTopMessage({
        data: {
          type: 'error',
          content: 'Camera access changed on the fly, please try again.',
        },
      });
      onError?.();
      return;
    }

    if (isCanceled) {
      onError?.();
      return;
    }

    if (constrains?.label) {
      const device = videoDevices.find((d) => d.label === constrains.label);
      if (device) {
        setDeviceId(device.deviceId);
      }
    }
  }, [onError]);

  useEffect(() => {
    findDevices();
  }, [findDevices]);

  const videoRef = useRef<HTMLVideoElement>(null);

  const [isLoading, setIsLoading] = useState(true);
  useLayoutEffect(() => {
    if (!deviceId) return;

    const videoElem = videoRef.current;
    if (!videoElem) return;
    const canplayListener = () => {
      setCanplay(true);
    };
    videoElem!.addEventListener('canplay', canplayListener);

    setIsLoading(true);
    const promise = codeReader.decodeFromVideoDevice(
      deviceId,
      videoElem,
      (result) => {
        if (result) {
          onSuccess(result.getText());
        }
      }
    );
    promise.finally(() => {
      setIsLoading(false);
    });

    return () => {
      videoElem!.removeEventListener('canplay', canplayListener);
      promise
        .then((controls) => {
          if (controls) {
            controls.stop();
          }
        })
        .catch(console.log);
    };
  }, [codeReader, onSuccess, deviceId]);

  return (
    <div
      className={classNames('qrcode-reader-loader', isLoading && 'is-loading')}
      style={{
        width: `${width}px`,
        height: `${height}px`,
      }}
    >
      {isLoading && <RcLoading className="w-[36px] h-[36px] loading-icon" />}
      <video
        ref={videoRef}
        style={{
          display: !isLoading && canplay ? 'block' : 'none',
          width: `${width}px`,
          height: `${height}px`,
          filter: 'blur(4px)',
        }}
        className={clsx('qrcode-reader-comp', className)}
      >
        <track kind="captions" />
      </video>
    </div>
  );
};

export default QRCodeReader;
