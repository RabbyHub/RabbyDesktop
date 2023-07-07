import { useEffect, useMemo, useRef, useState } from 'react';
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
  const checkCameraPermission = async () => {
    const devices = await window.navigator.mediaDevices.enumerateDevices();
    const webcams = devices.filter((device) => device.kind === 'videoinput');
    const hasWebcamPermissions = webcams.some(
      (webcam) => webcam.label && webcam.label.length > 0
    );
    if (!hasWebcamPermissions) {
      // TODO
    }
  };
  useEffect(() => {
    checkCameraPermission();
  }, []);
  useEffect(() => {
    const videoElem = document.getElementById('video');
    const canplayListener = () => {
      setCanplay(true);
    };
    videoElem!.addEventListener('canplay', canplayListener);
    const promise = codeReader.decodeFromVideoDevice(
      undefined,
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
  }, [codeReader, onSuccess]);

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
