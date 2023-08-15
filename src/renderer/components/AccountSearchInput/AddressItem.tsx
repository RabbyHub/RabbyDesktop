import { useAlias } from '@/renderer/hooks/rabbyx/useAlias';
import { useWhitelist } from '@/renderer/hooks/rabbyx/useWhitelist';
import { useWalletConnectIcon } from '@/renderer/hooks/useWalletConnectIcon';
import { isSameAddress } from '@/renderer/utils/address';
import { KEYRING_ICONS, WALLET_BRAND_CONTENT } from '@/renderer/utils/constant';
import { Tooltip } from 'antd';
import clsx from 'clsx';
import {
  memo,
  MouseEventHandler,
  // ReactNode,
  useMemo,
  useRef,
} from 'react';
import { splitNumberByStep } from '@/renderer/utils/number';
import { useCopyToClipboard } from 'react-use';
import AddressViewer from '../AddressViewer';
import { SignalBridge } from '../ConnectStatus/SignalBridge';
import { TipsWrapper } from '../TipWrapper';

export interface AddressItemProps {
  balance: number;
  address: string;
  type: string;
  brandName: string;
  className?: string;
  // extra?: ReactNode;
  alias?: string;
  onClick?: MouseEventHandler<HTMLDivElement>;
  // children?: React.ReactNode;
  onConfirm?: () => void;
}

const AddressItem = memo(
  ({
    balance,
    address,
    type,
    brandName,
    className,
    alias: aliasName,
    onClick,
    onConfirm,
  }: AddressItemProps) => {
    const { enable: whitelistEnable, whitelist: whiteList } = useWhitelist();

    const isInWhiteList = useMemo(() => {
      return whiteList.some((e) => isSameAddress(e, address));
    }, [whiteList, address]);

    const [_alias] = useAlias(address);
    const alias = _alias || aliasName;
    const titleRef = useRef<HTMLDivElement>(null);

    const brandIcon = useWalletConnectIcon({
      address,
      brandName,
      type,
    });

    const addressTypeIcon = useMemo(
      () =>
        brandIcon ||
        KEYRING_ICONS[type] ||
        WALLET_BRAND_CONTENT?.[brandName as keyof typeof WALLET_BRAND_CONTENT]
          ?.image,
      [type, brandName, brandIcon]
    );

    const [, copyToClipboard] = useCopyToClipboard();

    return (
      <div
        className={clsx(
          'searched-account-item relative',
          'group hover:bg-blue-light hover:bg-opacity-[0.1]',
          className
        )}
        onClick={(e) => {
          onClick?.(e);
          onConfirm?.();
        }}
        onKeyUp={(e) => {
          if (e.key === 'Enter') {
            onConfirm?.();
          }
        }}
      >
        <div className={clsx('searched-account-item-left mr-[8px]')}>
          <div className="relative">
            <img src={addressTypeIcon} className="w-[24px] h-[24px]" />
            <SignalBridge type={type} brandName={brandName} address={address} />
          </div>
        </div>

        <div className={clsx('searched-account-item-content')}>
          <div className="searched-account-item-title" ref={titleRef}>
            <>
              <div
                className={clsx('searched-account-item-alias')}
                title={alias}
              >
                {alias}
              </div>
              {whitelistEnable && isInWhiteList && (
                <Tooltip
                  overlayClassName="rectangle"
                  placement="top"
                  title="Whitelisted address"
                >
                  <img
                    src="rabby-internal://assets/icons/send-token/whitelist.svg"
                    className={clsx('w-14 h-14 ml-[4px]')}
                  />
                </Tooltip>
              )}
            </>
          </div>
          <div className="flex items-center">
            <AddressViewer
              address={address?.toLowerCase()}
              className={clsx('text-[#d3d8e0]')}
            />
            <TipsWrapper hoverTips="Copy" clickTips="Copied">
              <img
                src="rabby-internal://assets/icons/address-management/copy-white.svg"
                className="w-[14px] h-[14px] ml-4 cursor-pointer opacity-75"
                onClick={(e) => {
                  e.stopPropagation();
                  copyToClipboard(address);
                }}
              />
            </TipsWrapper>

            <span className="ml-[8px] text-12 text-[#d3d8e0]">
              ${splitNumberByStep(balance?.toFixed(2))}
            </span>
          </div>
        </div>
      </div>
    );
  }
);

export default AddressItem;
