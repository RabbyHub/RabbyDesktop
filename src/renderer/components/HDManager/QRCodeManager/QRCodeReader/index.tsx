import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { BrowserQRCodeReader } from '@zxing/browser';
import './style.less';
import clsx from 'clsx';

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
  const videoEl = useRef<HTMLVideoElement>(null);
  const [deviceId, setDeviceId] = useState<string | null>();
  const findDevices = useCallback(async () => {
    const devices = await window.navigator.mediaDevices.enumerateDevices();
    const videoDevices = devices.filter(
      (device) => device.kind === 'videoinput'
    );
    try {
      const { constrains } = await window.rabbyDesktop.ipcRenderer.invoke(
        'start-select-camera'
      );

      if (constrains?.label) {
        const device = videoDevices.find((d) => d.label === constrains.label);
        if (device) {
          setDeviceId(device.deviceId);
        }
      }
    } catch (e) {
      onError?.();
    }
  }, [onError]);

  useEffect(() => {
    findDevices();
  }, [findDevices]);
  useEffect(() => {
    if (!deviceId) return;
    const videoElem = document.getElementById('video');
    const canplayListener = () => {
      setCanplay(true);
    };
    videoElem!.addEventListener('canplay', canplayListener);
    const promise = codeReader.decodeFromVideoDevice(
      deviceId,
      'video',
      (result) => {
        if (result) {
          onSuccess(result.getText());
        }
      }
    );
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
    <video
      id="video"
      style={{
        display: canplay ? 'block' : 'none',
        width: `${width}px`,
        height: `${height}px`,
        filter: 'blur(4px)',
      }}
      ref={videoEl}
      className={clsx('qrcode-reader-comp', className)}
    >
      <track kind="captions" />
    </video>
  );
};

export default QRCodeReader;
