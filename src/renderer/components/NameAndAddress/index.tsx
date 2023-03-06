/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useState } from 'react';
import './index.less';
import clsx from 'classnames';
import { walletController } from '@/renderer/ipcRequest/rabbyx';
import { useCopyAddress } from '@/renderer/hooks/useCopyAddress';
import IconCopy from '../../../../assets/icons/common/copy.svg?rc';

interface NameAndAddressProps {
  className?: string;
  address: string;
  nameClass?: string;
  addressClass?: string;
  noNameClass?: string;
  copyIconClass?: string;
}

const NameAndAddress = ({
  className = '',
  address = '',
  nameClass = '',
  addressClass = '',
  noNameClass = '',
  copyIconClass = '',
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
            <IconCopy
              className={clsx('ml-4 cursor-pointer opacity-40', copyIconClass)}
              onClick={() => {
                copyAddress(address);
              }}
            />{' '}
            )
          </>
        ) : (
          <>
            {shortAddress}{' '}
            <IconCopy
              className={clsx('ml-4 cursor-pointer opacity-40', copyIconClass)}
              onClick={() => {
                copyAddress(address);
              }}
            />
          </>
        )}
      </div>
    </div>
  );
};

export default NameAndAddress;
