/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useState } from 'react';
import './index.less';
import clsx from 'classnames';
import { walletController } from '@/renderer/ipcRequest/rabbyx';
import { useCopyAddress } from '@/renderer/hooks/useCopyAddress';
import IconCopy from '../../../../assets/icons/common/copy.svg?rc';
import { TipsWrapper } from '../TipWrapper';

interface NameAndAddressProps {
  className?: string;
  address: string;
  nameClass?: string;
  addressClass?: string;
  noNameClass?: string;
  copyIconClass?: string;
  noCopy?: boolean;
}

const NameAndAddress = ({
  className = '',
  address = '',
  nameClass = '',
  addressClass = '',
  noNameClass = '',
  copyIconClass = '',
  noCopy = false,
}: NameAndAddressProps) => {
  const [aliasName, setAliasName] = useState('');
  const init = async () => {
    const alias =
      (await walletController.getAlianName(address?.toLowerCase())) || '';
    setAliasName(alias);
  };
  const localName = aliasName || '';

  const copyAddress = useCopyAddress();

  const shortAddress = `${address?.toLowerCase().slice(0, 6)}...${address
    ?.toLowerCase()
    .slice(-4)}`;

  useEffect(() => {
    init();
  }, [address]);
  return (
    <div className={clsx('name-and-address', className)}>
      {localName && (
        <div className={clsx('name', nameClass)} title={localName}>
          {localName}
        </div>
      )}
      <div
        className={clsx('address', addressClass, !localName && noNameClass)}
        title={address.toLowerCase()}
      >
        {localName ? (
          <>
            ({shortAddress}{' '}
            {!noCopy && (
              <TipsWrapper hoverTips="Copy" clickTips="Copied">
                <IconCopy
                  className={clsx(
                    'ml-4 cursor-pointer opacity-40',
                    copyIconClass
                  )}
                  onClick={() => {
                    copyAddress(address);
                  }}
                />
              </TipsWrapper>
            )}{' '}
            )
          </>
        ) : (
          <>
            {shortAddress}{' '}
            {!noCopy && (
              <TipsWrapper hoverTips="Copy" clickTips="Copied">
                <IconCopy
                  className={clsx(
                    'ml-4 cursor-pointer opacity-40',
                    copyIconClass
                  )}
                  onClick={() => {
                    copyAddress(address);
                  }}
                />
              </TipsWrapper>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default NameAndAddress;
