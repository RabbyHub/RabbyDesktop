import { useState } from 'react';
import { TokenItem } from '@rabby-wallet/rabby-api/dist/types';
import { useTranslation } from 'react-i18next';
import { Button } from 'antd';
import RcIconExternalLink from '@/../assets/icons/tx-toast/external-link.svg?rc';
import clsx from 'clsx';
import { findChainByServerID } from '@/renderer/utils/chain';
import { getAddressScanLink, getTokenSymbol } from '@/renderer/utils';
import { openExternalUrl } from '@/renderer/ipcRequest/app';
import { Modal } from '@/renderer/components/Modal/Modal';
import TokenWithChain from '@/renderer/components/TokenWithChain';
import { ellipsisAddress } from '@/renderer/utils/address';

export const useLowCreditState = () => {
  const [lowCreditToken, setLowCreditToken] = useState<TokenItem>();
  const [lowCreditVisible, setLowCreditVisible] = useState(false);

  return {
    lowCreditToken,
    lowCreditVisible,
    setLowCreditToken,
    setLowCreditVisible,
  };
};

export const LowCreditModal = ({
  className,
  token,
  onCancel,
  visible,
}: {
  visible: boolean;
  onCancel?: () => void;
  className?: string;
  token?: TokenItem;
}) => {
  const { t } = useTranslation();

  const openTokenAddress = () => {
    if (token) {
      const scanLink = findChainByServerID(token.chain)?.scanLink;
      if (!scanLink) return;

      openExternalUrl(getAddressScanLink(scanLink, token?.id));
    }
  };

  if (!token) {
    return null;
  }
  return (
    <Modal
      centered
      open={visible}
      width={320}
      cancelText={null}
      okText={null}
      footer={null}
      onCancel={onCancel}
      closable={false}
      className={clsx('modal-support-darkmode', className)}
      bodyStyle={{
        padding: 20,
      }}
      focusTriggerAfterClose={false}
    >
      <div className="flex flex-col">
        <div className="flex items-center justify-center">
          <TokenWithChain
            token={token}
            hideConer
            width="40px"
            height="40px"
            chainSize={20}
            chainIconPosition="tr"
          />
        </div>
        <div className="mt-8 mb-4 text-18 font-medium text-r-neutral-title-1 text-center">
          {getTokenSymbol(token)}
        </div>
        <div
          className="flex items-center justify-center gap-2 text-14 text-r-neutral-body cursor-pointer"
          onClick={openTokenAddress}
        >
          {ellipsisAddress(token.id)}
          <RcIconExternalLink className="w-14 h-14 " />
        </div>
        <div className="mt-16 mb-12 text-[16px] font-medium text-r-neutral-title1 text-center">
          {t('page.swap.lowCreditModal.title')}
        </div>
        <div className="mb-32 rounded-md p-10 pr-[9px] bg-r-neutral-card2 text-12 text-r-neutral-foot">
          {t('page.swap.lowCreditModal.desc')}
        </div>
        <Button
          type="primary"
          className="mt-auto h-40 text-15 font-medium rounded-md"
          onClick={onCancel}
        >
          {t('global.confirm')}
        </Button>
      </div>
    </Modal>
  );
};
