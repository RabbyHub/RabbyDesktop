import { useCurrentAccount } from '@/renderer/hooks/rabbyx/useAccount';
import { useCopyAddress } from '@/renderer/hooks/useCopyAddress';
import useCurrentBalance from '@/renderer/hooks/useCurrentBalance';
import { useSwitchChainModal } from '@/renderer/hooks/useSwitchChainModal';
import {
  CHAINS,
  CHAINS_ENUM,
  KEYRING_CLASS,
  KEYRING_ICONS,
  KEYRING_ICONS_WHITE,
  WALLET_BRAND_CONTENT,
} from '@/renderer/utils/constant';
import { splitNumberByStep } from '@/renderer/utils/number';
import { Button, Modal as AntdModal, ModalProps } from 'antd';
import classNames from 'classnames';
import QRCode from 'qrcode.react';
import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { useSetState } from 'react-use';

import { Modal } from '../Modal/Modal';
import styles from './index.module.less';

interface ReceiveContentProps {
  onCancel?: () => void;
  chain?: CHAINS_ENUM;
  token?: string;
}
const ReceiveContent = ({ onCancel, chain, token }: ReceiveContentProps) => {
  const { currentAccount } = useCurrentAccount();
  const [balance] = useCurrentBalance(currentAccount?.address);
  const confirmModalRef = useRef<ReturnType<typeof AntdModal.confirm>>();

  const icon = useMemo(() => {
    if (!currentAccount?.type) return '';
    return (
      KEYRING_ICONS[currentAccount.type] ||
      WALLET_BRAND_CONTENT[
        currentAccount.brandName as keyof typeof WALLET_BRAND_CONTENT
      ]?.image ||
      KEYRING_ICONS_WHITE[currentAccount.type]
    );
  }, [currentAccount]);

  const title = useMemo(() => {
    const chainName = (chain && CHAINS[chain]?.name) || 'Ethereum';
    const assets = token || 'assets';

    return `Receive ${assets} on ${chainName}`;
  }, [chain, token]);

  const isWatchAddress =
    currentAccount?.type && currentAccount?.type === KEYRING_CLASS.WATCH;

  const copy = useCopyAddress();

  useEffect(() => {
    if (!isWatchAddress) {
      return;
    }
    confirmModalRef.current = AntdModal.confirm({
      maskClosable: false,
      closable: true,
      centered: true,
      width: 520,
      className: styles.confirmModal,
      icon: null,
      okButtonProps: {
        block: true,
        ghost: true,
        size: 'large',
      },
      cancelButtonProps: {
        size: 'large',
        type: 'primary',
        block: true,
      },
      closeIcon: (
        <img
          className="icon close"
          src="rabby-internal://assets/icons/modal/close.svg"
        />
      ),
      content: (
        <div className={styles.confirmModalContent}>
          <img
            className={styles.confirmModalIcon}
            src="rabby-internal://assets/icons/modal/warning.svg"
          />
          <div>
            This is a Watch Mode address.
            <br />
            Are you sure to use it to receive assets?
          </div>
        </div>
      ),
    });
    return () => {
      confirmModalRef.current?.destroy();
    };
  }, [isWatchAddress]);

  useEffect(() => {
    confirmModalRef.current?.update({
      onCancel,
    });
  }, [onCancel]);

  if (!currentAccount) {
    return null;
  }

  return (
    <div className={styles.receive}>
      <div className={styles.receiveHeader}>
        <div className={styles.account}>
          <img src={icon} alt="" className={styles.accountIcon} />
          <div className="text-left overflow-hidden">
            <div className="flex items-center">
              <span className={styles.accountName}>
                {currentAccount?.alianName}
              </span>
              <span className={styles.accountBalance}>
                ${splitNumberByStep(balance || '0', 3, ',', true)}
              </span>
            </div>
            {isWatchAddress ? (
              <div className={styles.accountType}>Watch Mode address</div>
            ) : null}
          </div>
        </div>
      </div>
      <div className={styles.receiveBody}>
        <div className={styles.receiveTitle}>{title}</div>
        <div className={styles.receiveQRCodeContainer}>
          <div className={styles.receiveQRCode}>
            <QRCode value={currentAccount?.address} size={330} />
          </div>
        </div>
        <div className={styles.receiveAddress}>{currentAccount?.address}</div>
        <Button
          className={styles.receiveBtn}
          onClick={() => {
            copy(currentAccount?.address);
          }}
        >
          <img src="rabby-internal://assets/icons/receive/copy.svg" alt="" />
          Copy address
        </Button>
      </div>
    </div>
  );
};

interface ReceiveModalProps extends ModalProps {
  chain?: CHAINS_ENUM;
  token?: string;
  onCancel?: () => void;
}

export const ReceiveModal = ({
  onCancel,
  chain,
  token,
  ...modalProps
}: ReceiveModalProps) => {
  return (
    <Modal
      width={520}
      centered
      {...modalProps}
      onCancel={onCancel}
      footer={null}
      className={classNames(styles.receiveModal, modalProps.className)}
      destroyOnClose
    >
      <ReceiveContent onCancel={onCancel} chain={chain} token={token} />
    </Modal>
  );
};

export const ReceiveModalWraper = ({
  chain,
  open,
  token,
  onCancel,
}: ReceiveModalProps) => {
  const [state, setState] = useSetState({
    chain,
  });

  const currentChain = useMemo(
    () => chain || state.chain,
    [chain, state.chain]
  );

  const handleChange = useCallback(
    (v: CHAINS_ENUM) => {
      setState({
        chain: v,
      });
    },
    [setState]
  );

  const handleCancel = useCallback(() => {
    setState({
      chain: undefined,
    });
    onCancel?.();
  }, [onCancel, setState]);

  const { open: openChainModal } = useSwitchChainModal(
    handleChange,
    handleCancel
  );

  useEffect(() => {
    if (open && !currentChain) {
      openChainModal();
    }
  }, [currentChain, open, openChainModal]);

  const handleReceiveCancel = useCallback(() => {
    setState({
      chain: undefined,
    });
    onCancel?.();
  }, [onCancel, setState]);

  if (!currentChain) {
    return null;
  }

  return (
    <ReceiveModal
      open={open}
      chain={currentChain}
      token={token}
      onCancel={handleReceiveCancel}
    />
  );
};
