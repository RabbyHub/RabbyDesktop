import React, { useEffect, useRef, useState } from 'react';
// import { ReactComponent as RcIconMore } from '@/ui/assets/gas-account/more.svg';
import { useTranslation } from 'react-i18next';
import { TooltipWithMagnetArrow } from '@/renderer/components/Tooltip/TooltipWithMagnetArrow';
import { Button, Dropdown, Menu, Tooltip } from 'antd';
import { formatUsdValue } from '@/renderer/utils/number';
import { walletController } from '@/renderer/ipcRequest/rabbyx';
import { useCurrentAccount } from '@/renderer/hooks/rabbyx/useAccount';
import { GasAccountHistory } from './components/History';
// import { TooltipWithMagnetArrow } from '@/ui/component/Tooltip/TooltipWithMagnetArrow';
import { GasAccountLoginPopup } from './components/LoginPopup';
import { GasAccountDepositPopup } from './components/DepositPopup';
import {
  useAml,
  useGasAccountHistory,
  useGasAccountLogin,
  useGasAccountRefresh,
  useGasAccountSign,
} from './hooks';
import { GasAccountBlueBorderedButton } from './components/Button';
import { GasAccountLogoutPopup } from './components/LogoutPopop';
import { WithdrawPopup } from './components/WithdrawPopup';
import { GasAccountWrapperBg } from './components/WrapperBg';
import { GasAccountBlueLogo } from './components/GasAccountBlueLogo';
import { GasAccountInfo } from './type';
import { SwitchLoginAddrBeforeDepositModal } from './components/SwitchLoginAddrModal';

const DEPOSIT_LIMIT = 1000;

const GasAccountInner = ({
  setVisible,
  accountInfo,
}: {
  setVisible: React.Dispatch<React.SetStateAction<boolean>>;
  accountInfo: GasAccountInfo;
}) => {
  const { t } = useTranslation();
  const gasAccountHistory = useGasAccountHistory();
  const containerRef = useRef<HTMLDivElement>(null);

  const [loginVisible, setLoginVisible] = useState(false);

  const [logoutVisible, setLogoutVisible] = useState(false);

  const [depositVisible, setDepositVisible] = useState(false);

  const [withdrawVisible, setWithdrawVisible] = useState(false);

  // const history = useHistory();
  // const gotoDashboard = () => {
  //   history.push('/dashboard');
  // };

  const { currentAccount } = useCurrentAccount();

  const { account: gasAccount } = useGasAccountSign();

  const [switchAddrVisible, setSwitchAddrVisible] = useState(false);

  const isRisk = useAml();

  const openDepositPopup = () => {
    if (
      gasAccount?.address &&
      currentAccount?.address !== gasAccount?.address
    ) {
      setSwitchAddrVisible(true);
      return;
    }
    setDepositVisible(true);
  };

  const { value, loading, account } = accountInfo;
  const { isLogin } = useGasAccountLogin({ value, loading });

  const wallet = walletController;

  const balance = value?.account?.balance || 0;

  const { refresh } = useGasAccountRefresh();

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    wallet.clearPageStateCache();
  }, [wallet, wallet.clearPageStateCache]);

  useEffect(() => {
    if (!isLogin) {
      setLoginVisible(true);
    }
  }, [isLogin]);

  useEffect(() => {
    if (!loading && !isLogin) {
      setLoginVisible(true);
    }
  }, [loading, isLogin]);

  const rightItems = React.useMemo(
    () => (
      <Menu
        className="bg-r-neutral-bg-1 rounded-[6px] p-0 border-1 border-solid border-rabby-neutral-line"
        style={{
          boxShadow: '0px 8px 24px 0px rgba(0, 0, 0, 0.14)',
        }}
      >
        <Menu.Item
          className="px-12 h-40 flex items-center gap-[6px] bg-transparent hover:bg-transparent"
          key={0}
          onClick={() => {
            setLogoutVisible(true);
          }}
        >
          <img
            src="rabby-internal://assets/icons/gas-account/logout.svg"
            className="w-[16px] h-[16px] pr-4"
          />
          <span className="text-r-red-default text-13 font-medium">
            {t('page.gasAccount.logout')}
          </span>
        </Menu.Item>
      </Menu>
    ),
    [t]
  );

  return (
    <div
      className="gasAccountContent border-solid border-t-[1px] border-[#FFFFFF1A] h-[600px] w-[400px] bg-r-neutral-bg1 flex flex-col rounded-[12px] overflow-hidden"
      ref={containerRef}
    >
      <div className="text-20 text-r-neutral-title1 py-6 flex gap-2 items-center justify-center relative">
        {t('page.gasAccount.title')}
        <div className="flex items-center gap-20 absolute bottom-0 right-0 absolute right-16 top-2">
          <Dropdown
            overlay={rightItems}
            mouseLeaveDelay={0.3}
            trigger={['click']}
          >
            <img
              src="rabby-internal://assets/icons/gas-account/more.svg"
              className="w-20 h-20 cursor-pointer"
            />
          </Dropdown>
        </div>
      </div>
      <div className="flex-1 px-20 h-[555px] overflow-x-hidden overflow-y-scroll">
        <GasAccountWrapperBg className="mb-[20px] flex flex-col items-center h-[260px] bg-r-neutral-card1 rounded-[8px] py-20 px-16 pt-24">
          <GasAccountBlueLogo />
          <div className="text-r-neutral-title-1 text-[32px] leading-normal font-bold mt-24">
            {formatUsdValue(balance)}
          </div>

          <div className="w-full mt-auto flex gap-12 items-center justify-center relative">
            <GasAccountBlueBorderedButton
              block
              onClick={() => setWithdrawVisible(true)}
            >
              {t('page.gasAccount.withdraw')}
            </GasAccountBlueBorderedButton>
            <Tooltip
              autoAdjustOverflow
              overlayClassName="rectangle"
              open={isRisk || balance >= DEPOSIT_LIMIT ? undefined : false}
              title={
                isRisk
                  ? t('page.gasAccount.risk')
                  : t('page.gasAccount.gasExceed')
              }
            >
              <Button
                disabled={isRisk || balance >= DEPOSIT_LIMIT}
                block
                size="large"
                type="primary"
                className="text-r-neutral-title2 text-15 font-medium rounded-[6px]"
                style={{
                  height: 48,
                  borderRadius: 6,
                }}
                onClick={openDepositPopup}
              >
                {t('page.gasAccount.deposit')}
              </Button>
            </Tooltip>
          </div>
        </GasAccountWrapperBg>

        <GasAccountHistory gasAccountHistory={gasAccountHistory} />
      </div>

      <GasAccountLoginPopup
        visible={loginVisible}
        onCancel={() => {
          setVisible(false);
          setLoginVisible(false);
        }}
      />
      <GasAccountLogoutPopup
        visible={logoutVisible}
        account={account}
        onCancel={() => {
          setLogoutVisible(false);
        }}
      />
      <GasAccountDepositPopup
        visible={depositVisible}
        refreshHistory={gasAccountHistory.refreshListTx}
        onCancel={() => setDepositVisible(false)}
      />

      <WithdrawPopup
        visible={withdrawVisible}
        account={account}
        refreshHistory={gasAccountHistory.refreshListTx}
        onCancel={() => setWithdrawVisible(false)}
        balance={balance}
      />

      <SwitchLoginAddrBeforeDepositModal
        visible={switchAddrVisible}
        onCancel={() => {
          setSwitchAddrVisible(false);
        }}
        centered
        getContainer={false}
        maskStyle={{ position: 'absolute' }}
        wrapClassName="absolute"
        transitionName=""
        maskTransitionName=""
      />
    </div>
  );
};

export const GasAccount = ({
  setVisible,
  accountInfo,
}: {
  setVisible: React.Dispatch<React.SetStateAction<boolean>>;
  accountInfo: GasAccountInfo;
}) => {
  return <GasAccountInner setVisible={setVisible} accountInfo={accountInfo} />;
};
