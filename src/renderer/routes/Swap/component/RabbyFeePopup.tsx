import { useMemo } from 'react';
import RCIconRabbyWhite from '@/../assets/icons/swap/rabby.svg?rc';
import { useTranslation } from 'react-i18next';
import ImgMetaMask from '@/../assets/icons/swap/metamask.png';
import ImgPhantom from '@/../assets/icons/swap/phantom.png';
import ImgRabbyWallet from '@/../assets/icons/swap/rabby-wallet.png';
import clsx from 'clsx';
import { Button } from 'antd';
import { Modal } from '@/renderer/components/Modal/Modal';
import { DEX } from '../constant';

const swapFee = [
  {
    name: 'MetaMask',
    logo: ImgMetaMask,
    rate: '0.875%',
  },
  {
    name: 'Phantom',
    logo: ImgPhantom,
    rate: '0.85%',
  },
  {
    name: 'Rabby Wallet',
    logo: ImgRabbyWallet,
    rate: '0.25%',
  },
];

const bridgeList = [
  {
    name: 'MetaMask',
    logo: ImgMetaMask,
    rate: '0.875%',
  },
  {
    name: 'Rabby Wallet',
    logo: ImgRabbyWallet,
    rate: '0.25%',
  },
];

const fee = {
  swap: swapFee,
  bridge: bridgeList,
};

function SwapAggregatorFee({
  dexName,
  feeDexDesc,
}: {
  dexName?: string;
  feeDexDesc?: string;
}) {
  const logo = DEX?.[dexName as keyof typeof DEX]?.logo;
  if (dexName && feeDexDesc && logo) {
    return (
      <div className="flex justify-center mt-16 gap-[3px] text-12 text-r-neutral-foot">
        <img src={logo} className="w-[14px] h-[14px] rounded-full" />
        <span>{feeDexDesc}</span>
      </div>
    );
  }
  return null;
}

export const RabbyFeePopup = ({
  visible,
  onClose,
  type = 'swap',
  feeDexDesc,
  dexName,
}: {
  visible: boolean;
  onClose: () => void;
  type?: keyof typeof fee;
  dexName?: string;
  feeDexDesc?: string;
}) => {
  const { t } = useTranslation();

  const logo = useMemo(
    () => DEX?.[dexName as keyof typeof DEX]?.logo,
    [dexName]
  );

  const hasSwapDexFee = useMemo(() => {
    return type === 'swap' && dexName && feeDexDesc && logo;
  }, [type, dexName, feeDexDesc, logo]);

  return (
    <Modal
      visible={visible}
      title={null}
      width={400}
      closable={false}
      onCancel={onClose}
      centered
      bodyStyle={{
        padding: 20,
        paddingTop: 24,
        paddingBottom: 20,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div className="w-[52px] h-[52px] flex items-center justify-center rounded-full bg-r-blue-default mx-auto">
        <RCIconRabbyWhite viewBox="0 0 36 30" width="36" height="30" />
      </div>

      <div className="text-20 text-center font-medium text-r-neutral-title-1 my-12 leading-normal">
        {t('page.swap.rabbyFee.title')}
      </div>

      <div className="text-14 text-center  text-r-neutral-body leading-[150%]">
        {type === 'swap'
          ? t('page.swap.rabbyFee.swapDesc')
          : t('page.swap.rabbyFee.bridgeDesc')}
      </div>

      <div
        className={clsx(
          'flex justify-between items-center',
          'px-16  mb-6',
          'text-12 text-r-neutral-foot',
          type === 'bridge' ? 'mt-20' : hasSwapDexFee ? 'mt-20' : 'mt-[26px]'
        )}
      >
        <span>{t('page.swap.rabbyFee.wallet')}</span>
        <span>{t('page.swap.rabbyFee.rate')}</span>
      </div>
      <div className="border-[0.5px] border-solid border-[var(--r-neutral-line)] rounded-[6px]">
        {fee[type].map((item, idx, list) => (
          <div
            key={item.name}
            className={clsx(
              'flex justify-between items-center',
              'px-16 h-[44px]',
              'border-0 border-b-[0.5px] border-solid border-[var(--r-neutral-line)]',
              idx === list.length - 1 ? 'border-b-0' : ''
            )}
          >
            <div className="flex items-center">
              <img src={item.logo} className="w-[18px] h-[18px] mr-8" />
              <span className="text-13 leading-normal font-medium text-r-neutral-title-1">
                {item.name}
              </span>
            </div>
            <span className="text-13 leading-normal font-medium text-r-neutral-title-1">
              {item.rate}
            </span>
          </div>
        ))}
      </div>

      <SwapAggregatorFee dexName={dexName} feeDexDesc={feeDexDesc} />

      <Button
        type="primary"
        block
        size="large"
        className="mt-[20px] h-[48px] text-16 font-medium text-r-neutral-title-2 rounded-md"
        onClick={onClose}
      >
        {t('page.swap.rabbyFee.button')}
      </Button>
    </Modal>
  );
};
