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
}

const KEYSTONE_TYPE = KEYRING_CLASS.HARDWARE.KEYSTONE;

export const QRCodeConnect: React.FC<Props> = ({
  brand = WALLET_BRAND_TYPES.KEYSTONE,
}) => {
  const { keyringId } = React.useContext(HDManagerStateContext);
  const brandInfo = WALLET_BRAND_CONTENT[brand];
  const wallet = walletController;
  const decoder = React.useRef(new URDecoder());
  const [errorMessage, setErrorMessage] = React.useState('');
  const stashKeyringIdRef = React.useRef<number | null>(null);
  const [visibleManager, setVisibleManager] = React.useState(false);

  const goToSelectAddress = React.useCallback(() => {
    setVisibleManager(true);
  }, []);

  const handleScanQRCodeSuccess = async (data: string) => {
    try {
      decoder.current.receivePart(data);
      if (decoder.current.isComplete()) {
        const result = decoder.current.resultUR();
        if (result.type === 'crypto-hdkey') {
          stashKeyringIdRef.current = await wallet.submitQRHardwareCryptoHDKey(
            result.cbor.toString('hex'),
            stashKeyringIdRef.current
          );
        } else if (result.type === 'crypto-account') {
          stashKeyringIdRef.current =
            await wallet.submitQRHardwareCryptoAccount(
              result.cbor.toString('hex'),
              stashKeyringIdRef.current
            );
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

  React.useEffect(() => {
    wallet.requestKeyring(KEYSTONE_TYPE, 'isReady', keyringId).then((res) => {
      if (res) {
        goToSelectAddress();
      }
    });
  }, [goToSelectAddress, keyringId, wallet]);

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
              />
            </div>
          </div>
        </section>
      )}
      {visibleManager && <QRCodeManager brand={brand} />}
    </>
  );
};
