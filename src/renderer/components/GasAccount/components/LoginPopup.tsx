import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Drawer } from 'antd';
import IconCopySrc from '@/../assets/icons/common/copy.svg';
import { useWalletConnectIcon } from '@/renderer/hooks/useWalletConnectIcon';
import { useCurrentAccount } from '@/renderer/hooks/rabbyx/useAccount';
import { noop } from 'lodash';
import clsx from 'clsx';
import AddressViewer from '@/renderer/components/AddressViewer';
import { useAlias } from '@/renderer/hooks/rabbyx/useAlias';
import {
  KEYRING_CLASS,
  KEYRING_ICONS,
  WALLET_BRAND_CONTENT,
  WALLET_BRAND_TYPES,
} from '@/renderer/utils/constant';
import { useCopyAddress } from '@/renderer/hooks/useCopyAddress';
import { TipsWrapper } from '../../TipWrapper';
import { useGasAccountMethods } from '../hooks';
import { GasAccountBlueBorderedButton } from './Button';
import { GasAccountBlueLogo } from './GasAccountBlueLogo';
import { GasAccountWrapperBg } from './WrapperBg';
import styles from '../index.module.less';
import { GasAccountInfo } from '../type';

export const GasACcountCurrentAddress = ({
  account,
}: {
  account?: GasAccountInfo['account'] | undefined;
}) => {
  const { currentAccount } = useCurrentAccount();

  const brandIcon = useWalletConnectIcon({
    address: currentAccount?.address || '',
    brandName: currentAccount?.brandName || '',
    type: currentAccount?.type || '',
  });

  const copyAddress = useCopyAddress();

  const [alias] = useAlias(account?.address || currentAccount?.address || '');

  const addressTypeIcon = useMemo(
    () =>
      brandIcon ||
      WALLET_BRAND_CONTENT?.[
        (account?.brandName as WALLET_BRAND_TYPES) || currentAccount?.brandName
      ]?.image ||
      KEYRING_ICONS[
        account?.type || currentAccount?.type || KEYRING_CLASS.MNEMONIC
      ],
    [brandIcon, account?.brandName, account?.type, currentAccount]
  );
  return (
    <div className="mb-[20px] py-12 px-16 rounded-[6px] flex items-center bg-r-neutral-card-2">
      <img src={addressTypeIcon} className="w-24 h-24" />
      <span className="ml-[8px] mr-4 text-15 font-medium text-r-neutral-title-1">
        {alias}
      </span>
      <AddressViewer
        className="text-13 text-r-neutral-body relative top-1"
        address={account?.address || currentAccount?.address || ''}
      />
      <TipsWrapper hoverTips="Copy" clickTips="Copied">
        <img
          className={clsx(
            `w-[14px] h-[14px] ml-4 text-14  cursor-pointer relative top-1`
          )}
          src={IconCopySrc}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          onClick={(evt: any) => {
            evt.stopPropagation();
            copyAddress(account?.address || currentAccount?.address || '');
          }}
        />
      </TipsWrapper>
    </div>
  );
};

const GasAccountLoginContent = ({ onClose }: { onClose: () => void }) => {
  const [toConfirm, setToConfirm] = useState(false);
  const { t } = useTranslation();

  const { login } = useGasAccountMethods();

  const gotoLogin = () => {
    setToConfirm(true);
  };

  const currentAccount = useCurrentAccount();

  const confirmAddress = () => {
    login();
    onClose();
  };

  if (toConfirm && currentAccount) {
    return (
      <div className="rounded-[12px] bg-r-neutral-bg1 border-t-[1px] border-[#FFFFFF1A] w-full h-full flex flex-col justify-center items-center">
        <div className="text-20 font-medium text-r-neutral-title1 mt-20 mb-[24px]">
          {t('page.gasAccount.loginConfirmModal.title')}
        </div>
        <GasACcountCurrentAddress />
        <div className=" text-14 text-r-neutral-body">
          {t('page.gasAccount.loginConfirmModal.desc')}
        </div>
        <div
          className={clsx(
            'flex items-center justify-center gap-16',
            'w-full mt-auto px-20 py-16 border-t-[0.5px] border-solid border-rabby-neutral-line border-0'
          )}
        >
          <GasAccountBlueBorderedButton onClick={onClose} block>
            {t('global.Cancel')}
          </GasAccountBlueBorderedButton>

          <Button
            onClick={confirmAddress}
            block
            size="large"
            type="primary"
            className="h-[48px] text-r-neutral-title2 text-15 font-medium rounded-[6px]"
          >
            {t('global.Confirm')}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <GasAccountWrapperBg className="w-full h-full flex flex-col justify-center items-center relative rounded-[12px] bg-r-neutral-bg1 border-t-[1px] border-[#FFFFFF1A]">
      <GasAccountBlueLogo className="w-[60px] h-[60px] my-24" />
      <div className="relative flex gap-8 mb-[16px] text-18 font-medium text-r-blue-default">
        <img
          src="rabby-internal://assets/icons/gas-account/quote-start.svg"
          className="absolute top-0 left-[-20px]"
        />
        {t('page.gasAccount.loginInTip.title')}
      </div>
      <div className="flex gap-8 text-18 font-medium text-r-blue-default relative">
        {t('page.gasAccount.loginInTip.desc')}
        <img
          src="rabby-internal://assets/icons/gas-account/quote-end.svg"
          className="absolute top-0 right-[-20px]"
        />
      </div>
      <div className="w-full mt-auto px-20 py-16 border-t-[0.5px] border-solid border-rabby-neutral-line border-0">
        <Button
          onClick={gotoLogin}
          type="primary"
          block
          className="h-[48px] text-15 font-medium leading-normal text-r-neutral-title2 rounded-[6px]"
        >
          {t('page.gasAccount.loginInTip.login')}
        </Button>
      </div>
    </GasAccountWrapperBg>
  );
};

export const GasAccountLoginPopup = (props: {
  onCancel: () => void;
  visible: boolean;
}) => {
  const { onCancel, visible } = props;

  return (
    <Drawer
      placement="bottom"
      getContainer={false}
      height={280}
      width={1}
      maskClosable
      closable={false}
      onClose={onCancel}
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
      push={false}
      open={visible}
      destroyOnClose
      {...props}
    >
      <GasAccountLoginContent onClose={onCancel || noop} />
    </Drawer>
  );
};
