import { walletController } from '@/renderer/ipcRequest/rabbyx';
import { ellipsis } from '@/renderer/utils/address';
import {
  CHAINS,
  KEYRING_ICONS,
  WALLET_BRAND_CONTENT,
  WALLET_BRAND_TYPES,
} from '@/renderer/utils/constant';
import { formatAmount } from '@/renderer/utils/number';
import classNames from 'classnames';
import React from 'react';
import BN from 'bignumber.js';

export interface Props {
  data: IDisplayedAccountWithBalance;
  selected?: boolean;
  onClick(data: IDisplayedAccountWithBalance): void;
  networkId: string;
}

const IconChecked = 'rabby-internal://assets/icons/queue/address-checked.svg';
const IconUnCheck = 'rabby-internal://assets/icons/queue/address-uncheck.svg';

export const AddressItem: React.FC<Props> = ({
  data,
  selected,
  onClick,
  networkId,
}) => {
  const brandName = data.brandName as WALLET_BRAND_TYPES;
  const addressTypeIcon = React.useMemo(
    () => KEYRING_ICONS[data.type] || WALLET_BRAND_CONTENT?.[brandName]?.image,
    [data.type, brandName]
  );
  const [nativeTokenSymbol, setNativeTokenSymbol] = React.useState('ETH');
  const [nativeTokenBalance, setNativeTokenBalance] = React.useState<
    null | string
  >(null);

  const init = React.useCallback(async () => {
    const chain = Object.values(CHAINS).find(
      (item) => item.id.toString() === networkId
    );
    setNativeTokenSymbol(chain!.nativeTokenSymbol);
    const balanceInWei = await walletController.requestETHRpc(
      {
        method: 'eth_getBalance',
        params: [data.address, 'latest'],
      },
      chain!.serverId
    );
    setNativeTokenBalance(new BN(balanceInWei).div(1e18).toFixed());
  }, [networkId, data.address]);

  React.useEffect(() => {
    init();
  }, [init]);

  return (
    <div
      onClick={() => onClick(data)}
      className={classNames(
        'flex justify-between items-center py-[10px] px-[16px]',
        'border border-solid border-[#FFFFFF1A] rounded-[6px]',
        'text-white bg-[#FFFFFF0A]',
        'cursor-pointer'
      )}
    >
      <div className="flex gap-[10px]">
        <img
          className="w-[32px] h-[32px]"
          src={addressTypeIcon}
          alt={data.brandName}
        />
        <div className={classNames('flex flex-col gap-[4px]', 'text-white')}>
          <span className="text-[15px]">{data.alianName}</span>
          <span className="opacity-60 text-[12px]">
            {ellipsis(data.address)}
          </span>
        </div>
      </div>
      <div className="flex gap-[25px] items-center">
        <span className="text-[12px] opacity-60">
          {nativeTokenBalance ? formatAmount(nativeTokenBalance) : 0}{' '}
          {nativeTokenSymbol}
        </span>
        <div>
          <img src={selected ? IconChecked : IconUnCheck} alt="" />
        </div>
      </div>
    </div>
  );
};
