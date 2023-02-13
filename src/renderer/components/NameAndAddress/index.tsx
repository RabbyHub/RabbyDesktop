/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useState } from 'react';
import './index.less';
import clsx from 'classnames';
import { walletController } from '@/renderer/ipcRequest/rabbyx';

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
        {localName
          ? `(${address?.toLowerCase().slice(0, 6)}...${address
              ?.toLowerCase()
              .slice(-4)})`
          : `${address?.toLowerCase().slice(0, 6)}...${address
              ?.toLowerCase()
              .slice(-4)}`}
      </div>
    </div>
  );
};

export default NameAndAddress;
