import React from 'react';
import {
  KEYRING_CLASS,
  WALLET_BRAND_CONTENT,
  WALLET_BRAND_TYPES,
} from '@/renderer/utils/constant';
import clsx from 'clsx';
import { walletController } from '@/renderer/ipcRequest/rabbyx';
import { URDecoder } from '@ngraveio/bc-ur';
import * as Sentry from '@sentry/react';
import QRCodeReader from './QRCodeReader';
import { QRCodeManager } from './QRCodeManager';
import { HDManagerStateContext } from '../utils';

interface Props {
  brand?: WALLET_BRAND_TYPES;
  onClose?: () => void;
}

const KEYSTONE_TYPE = KEYRING_CLASS.HARDWARE.KEYSTONE;

export const QRCodeConnect: React.FC<Props> = ({
  brand = WALLET_BRAND_TYPES.KEYSTONE,
  onClose,
}) => {
  const { keyringId, setKeyringId } = React.useContext(HDManagerStateContext);
  const brandInfo = WALLET_BRAND_CONTENT[brand];
  const wallet = walletController;
  const decoder = React.useRef(new URDecoder());
  const [errorMessage, setErrorMessage] = React.useState('');
  const [visibleManager, setVisibleManager] = React.useState(false);

  const goToSelectAddress = React.useCallback(() => {
    setVisibleManager(true);
  }, []);

  const handleClose = React.useCallback(() => {
    setVisibleManager(false);
  }, []);

  const handleScanQRCodeSuccess = async (data: string) => {
    try {
      decoder.current.receivePart(data);
      if (decoder.current.isComplete()) {
        const result = decoder.current.resultUR();
        let id;
        if (result.type === 'crypto-hdkey') {
          id = await wallet.submitQRHardwareCryptoHDKey(
            result.cbor.toString('hex'),
            keyringId
          );
        } else if (result.type === 'crypto-account') {
          id = await wallet.submitQRHardwareCryptoAccount(
            result.cbor.toString('hex'),
            keyringId
          );
          setKeyringId(id);
        } else {
          Sentry.captureException(
            new Error(`QRCodeError ${JSON.stringify(result)}`)
          );
          setErrorMessage(
            'Invalid QR code. Please scan the sync QR code of the hardware wallet.'
          );
          return;
        }

        goToSelectAddress();
      }
    } catch (e) {
      setErrorMessage(
        'Invalid QR code. Please scan the sync QR code of the hardware wallet.'
      );
    }
  };

  const initHD = React.useCallback(async () => {
    const id = await walletController.initQRHardware(brand);
    const isReady = await walletController.requestKeyring(
      KEYSTONE_TYPE,
      'isReady',
      id
    );
    if (isReady) {
      goToSelectAddress();
    }
    setKeyringId(id);
  }, [brand, goToSelectAddress, setKeyringId]);

  React.useEffect(() => {
    if (!visibleManager) {
      initHD();
    }
  }, [initHD, visibleManager]);

  return (
    <>
      {!visibleManager && (
        <section className="pt-[20px]">
          <header className="text-center space-y-[16px]">
            <h1 className="text-[28px] font-bold text-[#FFFFFF]">
              {brandInfo.name}
            </h1>
            <p className="text-[15px] opacity-80 text-[#FFFFFF]">
              Scan the QR code on the Keystone hardware wallet
            </p>
          </header>
          <div className="space-y-[60px] mt-[60px]">
            <div>
              <img
                className="w-[80px] h-[80px] mx-auto block"
                src={brandInfo.image}
              />
            </div>
            <div
              className={clsx(
                'm-auto rounded-[10px] p-[16px] bg-[#3E4351]',
                'w-[320px] h-[320px]',
                'border border-solid border-[#FFFFFF1A]'
              )}
            >
              <QRCodeReader
                width={288}
                height={288}
                onSuccess={handleScanQRCodeSuccess}
                onError={onClose}
              />
            </div>
          </div>
        </section>
      )}
      {visibleManager && <QRCodeManager brand={brand} onClose={handleClose} />}
    </>
  );
};
