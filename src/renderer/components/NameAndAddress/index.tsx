/* eslint-disable react-hooks/exhaustive-deps */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import './index.less';
import clsx from 'classnames';
import { walletController } from '@/renderer/ipcRequest/rabbyx';
import { useCopyAddress } from '@/renderer/hooks/useCopyAddress';
// import IconCopy from '@/../assets/icons/common/copy.svg?rc';
import IconCopySrc from '@/../assets/icons/common/copy.svg';
import IconShareSrc from '@/../assets/icons/common/share.svg';

import { openExternalUrl } from '@/renderer/ipcRequest/app';
import { findChainByEnum } from '@/renderer/utils';
import { ellipsisAddress } from '@/renderer/utils/address';
import { TipsWrapper } from '../TipWrapper';

interface NameAndAddressProps {
  className?: string;
  address: string;
  nameClass?: string;
  addressClass?: string;
  noNameClass?: string;
  copyIconClass?: string;
  copyIconOpacity?: number;
  openExternal?: boolean;
  chainEnum?: CHAINS_ENUM;
  copyIcon?: boolean | string;
  addressSuffix?: React.ReactNode;
}

const NameAndAddress = ({
  className = '',
  address = '',
  nameClass = '',
  addressClass = '',
  noNameClass = '',
  copyIconClass = '',
  copyIconOpacity = 40,
  openExternal = false,
  chainEnum,
  copyIcon = true,
  addressSuffix,
}: NameAndAddressProps) => {
  const [aliasName, setAliasName] = useState('');

  const mountedRef = useRef(false);
  const init = async () => {
    const alias =
      (await walletController.getAlianName(address?.toLowerCase())) || '';

    if (!mountedRef.current) return;
    setAliasName(alias);
  };
  const localName = aliasName || '';

  const copyAddress = useCopyAddress();

  const handleClickContractId = useCallback(() => {
    if (!chainEnum) return;
    const chainItem = findChainByEnum(chainEnum);
    if (!chainItem?.scanLink) return;

    openExternalUrl(
      chainItem?.scanLink.replace(/tx\/_s_/, `address/${address}`)
    );
  }, [chainEnum]);

  useEffect(() => {
    mountedRef.current = true;
    init();

    return () => {
      mountedRef.current = false;
    };
  }, [address]);

  const { isShowCopyIcon, iconCopySrc } = useMemo(() => {
    return {
      isShowCopyIcon: !!copyIcon,
      iconCopySrc:
        typeof copyIcon === 'string'
          ? copyIcon.trim() || IconCopySrc
          : IconCopySrc,
    };
  }, [copyIcon]);

  return (
    <div
      className={clsx(
        'name-and-address',
        localName && 'with-local-name',
        className
      )}
    >
      {localName && (
        <div className={clsx('name', nameClass)} title={localName}>
          {localName}
        </div>
      )}
      <div
        className={clsx('address', addressClass, !localName && noNameClass)}
        title={address.toLowerCase()}
      >
        <>
          {localName
            ? `(${ellipsisAddress(address?.toLowerCase() || '')})`
            : `${ellipsisAddress(address?.toLowerCase() || '')}`}
          {localName ? ' ' : ''}
        </>
      </div>
      {addressSuffix || null}
      {isShowCopyIcon && (
        <TipsWrapper hoverTips="Copy" clickTips="Copied">
          <img
            className={clsx(
              `ml-4 cursor-pointer opacity-${copyIconOpacity}`,
              copyIconClass
            )}
            src={iconCopySrc}
            onClick={(evt: any) => {
              evt.stopPropagation();
              copyAddress(address);
            }}
          />
        </TipsWrapper>
      )}
      {openExternal && (
        <img
          onClick={handleClickContractId}
          src={IconShareSrc}
          width={16}
          height={16}
          className={clsx('ml-6 cursor-pointer', copyIconClass)}
        />
      )}
    </div>
  );
};

export default NameAndAddress;
