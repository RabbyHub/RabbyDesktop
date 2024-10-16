import React, { CSSProperties, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Space, Tooltip, Drawer } from 'antd';
import { FixedSizeList } from 'react-window';
import { noop } from 'lodash';
import clsx from 'clsx';
import { useAsync } from 'react-use';
import { TokenItem } from '@rabby-wallet/rabby-api/dist/types';
import BigNumber from 'bignumber.js';
import { L2_DEPOSIT_ADDRESS_MAP } from '@/renderer/utils/constant';
import TokenWithChain from '@/renderer/components/TokenWithChain';
import Empty from '@/renderer/components/Empty';
import { formatUsdValue } from '@/renderer/utils/number';
import { walletController, walletOpenapi } from '@/renderer/ipcRequest/rabbyx';
import { useCurrentAccount } from '@/renderer/hooks/rabbyx/useAccount';
import { getTokenSymbol } from '@/renderer/utils';
import { findChainByServerID } from '@/renderer/utils/chain';
import { GasAccountCloseIcon } from './PopupCloseIcon';
import styles from '../index.module.less';

const amountList = [20, 100, 500];

const TokenSelector = ({
  visible,
  onClose,
  cost,
  onChange,
}: {
  visible: boolean;
  onClose: () => void;
  cost: number;
  onChange: (token: TokenItem) => void;
}) => {
  const { t } = useTranslation();

  const { currentAccount } = useCurrentAccount();
  const { value: list, loading } = useAsync(
    async () =>
      walletOpenapi.getGasAccountTokenList(currentAccount?.address || ''),
    [currentAccount?.address]
  );

  const sortedList = React.useMemo(
    () => list?.sort((a, b) => b.amount - a.amount) || [],
    [list]
  );

  const Row = React.useCallback(
    ({
      index,
      data,
      style,
    }: {
      // eslint-disable-next-line react/no-unused-prop-types
      index: number;
      // eslint-disable-next-line react/no-unused-prop-types
      data: TokenItem[];
      // eslint-disable-next-line react/no-unused-prop-types
      style: CSSProperties;
    }) => {
      const item = data[index];
      const disabled = new BigNumber(item.amount || 0)
        .times(item.price)
        .lt(new BigNumber(cost).times(1));

      return (
        <Tooltip
          overlayClassName={clsx('rectangle')}
          placement="top"
          open={disabled ? undefined : false}
          title={t('page.gasTopUp.InsufficientBalanceTips')}
          align={{ targetOffset: [0, -30] }}
        >
          <div
            key={item.id}
            style={style}
            className={clsx(
              'flex justify-between items-center cursor-pointer px-[20px] h-[52px] border border-transparent  rounded-[6px]',
              'text-13 font-medium text-r-neutral-title-1 border-solid border-1',
              !disabled && 'hover:border-blue-light',
              disabled && 'opacity-50 cursor-not-allowed'
            )}
            onClick={() => {
              if (!disabled) {
                onChange(item);
                onClose();
              }
            }}
          >
            <Space size={12}>
              <TokenWithChain token={item} hideConer />
              <span>{getTokenSymbol(item)}</span>
            </Space>
            <div>{formatUsdValue(item.amount * item.price || 0)}</div>
          </div>
        </Tooltip>
      );
    },
    [cost, onChange, t, onClose]
  );

  return (
    <Drawer
      placement="bottom"
      getContainer={false}
      height={500}
      width={1}
      maskClosable
      closable={false}
      onClose={onClose}
      bodyStyle={{
        padding: 0,
      }}
      className={styles.drawer}
      style={{
        overflow: 'hidden',
      }}
      maskStyle={{
        borderRadius: '12px',
      }}
      open={visible}
      destroyOnClose
    >
      <div className="flex flex-col h-full pt-20 relative">
        <GasAccountCloseIcon
          className="absolute right-16 top-20 cursor-pointer"
          onClick={onClose}
        />
        <div>
          <div className="flex justify-center items-center text-center">
            <div className="text-20 font-medium text-center text-r-neutral-title-1 ">
              {t('page.gasTopUp.Select-from-supported-tokens')}
            </div>
          </div>
          <div className="px-20">
            <div className="flex justify-between text-12 text-r-neutral-body pt-[24px] pb-8 border-b-[1px] border-r-neutral-line border-solid border-0">
              <div>{t('page.gasTopUp.Token')}</div>
              <div>{t('page.gasTopUp.Value')}</div>
            </div>
          </div>
        </div>
        <div className="overflow-y-auto flex-1 relative">
          {!loading && sortedList?.length === 0 && (
            <Empty className="pt-[80px]">
              <div className="text-14 text-r-neutral-body mb-12">
                {t('page.gasTopUp.No_Tokens')}
              </div>
            </Empty>
          )}
          {loading && (
            <div className="flex flex-col items-center justify-center pt-[80px]">
              <img
                src="rabby-internal://assets/icons/gas-account/loading-round.svg"
                className="animate-spin"
              />
              <div className="mt-12 text-r-neutral-title-1">
                {t('page.gasTopUp.Loading_Tokens')}
              </div>
            </div>
          )}

          {!loading && (
            <FixedSizeList
              width="100%"
              height={402}
              itemCount={sortedList?.length || 0}
              itemData={sortedList}
              itemSize={52}
            >
              {({ data, index, style }) => Row({ data, index, style })}
            </FixedSizeList>
          )}
        </div>
      </div>
    </Drawer>
  );
};

const GasAccountDepositContent = ({
  onClose,
  setTokenListVisible,
  tokenListVisible,
}: {
  onClose: () => void;
  setTokenListVisible: React.Dispatch<React.SetStateAction<boolean>>;
  tokenListVisible: boolean;
}) => {
  const { t } = useTranslation();
  const [selectedAmount, setAmount] = useState(100);
  const [token, setToken] = useState<TokenItem | undefined>(undefined);
  const openTokenList = () => {
    setTokenListVisible(true);
  };

  const closeTokenList = () => {
    setTokenListVisible(false);
  };

  const topUpGasAccount = () => {
    if (token) {
      const chainEnum = findChainByServerID(token.chain);
      if (chainEnum) {
        walletController.topUpGasAccount({
          to: L2_DEPOSIT_ADDRESS_MAP[chainEnum.enum],
          chainServerId: chainEnum.serverId,
          tokenId: token.id,
          amount: selectedAmount,
          rawAmount: new BigNumber(selectedAmount)
            .times(10 ** token.decimals)
            .toFixed(0),
        });
        onClose();
      }
    }
  };

  return (
    <div className="w-full h-full flex flex-col justify-center items-center leading-normal relative">
      <GasAccountCloseIcon
        className="absolute bottom-0 right-0 absolute right-20 top-16 cursor-pointer"
        onClick={onClose}
      />
      <div className="text-20 font-medium text-r-neutral-title1 mt-20 mb-[12px]">
        {t('page.gasAccount.depositPopup.title')}
      </div>
      <div className="text-center text-13 text-r-neutral-body px-20">
        {t('page.gasAccount.depositPopup.desc')}
      </div>

      <div className="w-full px-20">
        <div className="mt-8 mb-8 text-13 text-r-neutral-body">
          {t('page.gasAccount.depositPopup.amount')}
        </div>
        <div className="flex items-center justify-between">
          {amountList.map((amount) => (
            <div
              key={amount}
              onClick={() => setAmount(amount)}
              className={clsx(
                'flex items-center justify-center cursor-pointer',
                'rounded-[6px] w-[114px] h-[52px]',
                'text-18 font-medium',
                'bg-r-neutral-card2',
                'border border-solid border-transparent',
                'hover:bg-r-blue-light-1 hover:border-rabby-blue-default',
                selectedAmount === amount
                  ? 'bg-r-blue-light-1 border-rabby-blue-default text-r-blue-default'
                  : 'text-r-neutral-title1'
              )}
            >
              ${amount}
            </div>
          ))}
        </div>

        <div className="mt-12 mb-8 text-13 text-r-neutral-body">
          {t('page.gasAccount.depositPopup.token')}
        </div>
        <div
          className="flex items-center justify-between rounded-[6px] w-full h-[52px] px-16 py-0 bg-r-neutral-card2 cursor-pointer"
          onClick={openTokenList}
        >
          {token ? (
            <div className="flex items-center gap-12">
              <TokenWithChain
                token={token}
                hideConer
                width="24px"
                height="24px"
              />
              <span className="text-15 font-medium text-r-neutral-title1">
                {getTokenSymbol(token)}
              </span>
            </div>
          ) : (
            <span className="text-15 font-medium text-r-neutral-title1">
              {t('page.gasAccount.depositPopup.selectToken')}
            </span>
          )}
          <img
            src="rabby-internal://assets/icons/gas-account/IconRightArrow.svg"
            className="w-[20px] h-[20px]"
          />
        </div>
      </div>

      <div className="w-full mt-auto px-20 py-16 border-t-[0.5px] border-solid border-rabby-neutral-line flex items-center justify-center border-0">
        <Button
          onClick={topUpGasAccount}
          block
          size="large"
          type="primary"
          className="h-[48px] text-r-neutral-title2 text-15 font-medium rounded-[6px]"
          disabled={!token}
        >
          {t('global.Confirm')}
        </Button>
      </div>

      <TokenSelector
        visible={tokenListVisible}
        onClose={closeTokenList}
        cost={selectedAmount}
        onChange={setToken}
      />
    </div>
  );
};

export const GasAccountDepositPopup = (props: {
  onCancel: () => void;
  visible: boolean;
}) => {
  const [tokenListVisible, setTokenListVisible] = useState(false);
  const { onCancel, visible } = props;

  return (
    <Drawer
      placement="bottom"
      getContainer={false}
      height={tokenListVisible ? 500 : 375}
      width={1}
      maskClosable
      closable={false}
      onClose={() => {
        onCancel?.();
        setTokenListVisible(false);
      }}
      bodyStyle={{
        padding: 0,
      }}
      className={styles.drawer}
      style={{
        overflow: 'hidden',
      }}
      push={false}
      maskStyle={{
        borderRadius: '12px',
      }}
      open={visible}
      destroyOnClose
      {...props}
    >
      <GasAccountDepositContent
        onClose={onCancel || noop}
        tokenListVisible={tokenListVisible}
        setTokenListVisible={setTokenListVisible}
      />
    </Drawer>
  );
};
