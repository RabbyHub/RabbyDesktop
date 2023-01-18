import {
  useDapps,
  useProtocolDappsBinding,
} from '@/renderer/hooks/useDappsMngr';
import { Button, message, ModalProps } from 'antd';
import classNames from 'classnames';
import React, { useEffect, useMemo, useState } from 'react';

import { DappFavicon } from '../DappFavicon';
import { Modal } from '../Modal/Modal';
import ModalAddDapp, { AddDapp } from '../ModalAddDapp';
import styles from './index.module.less';

const Checkbox = ({
  checked,
  className,
  onChange,
}: {
  checked?: boolean;
  className?: string;
  onChange?: (v: boolean) => void;
}) => {
  return (
    <img
      className={className}
      onClick={() => onChange?.(!checked)}
      src={
        checked
          ? 'rabby-internal://assets/icons/checkbox/checked.svg'
          : 'rabby-internal://assets/icons/checkbox/unchecked.svg'
      }
    />
  );
};

interface DappCardProps {
  dapp: IMergedDapp;
  checked?: boolean;
  onSelect?: (dapp: IMergedDapp) => void;
}
const DappCard = ({ checked, onSelect, dapp }: DappCardProps) => {
  return (
    <div
      className={classNames(styles.dapp, checked ? styles.dappActive : null)}
      onClick={() => {
        onSelect?.(dapp);
      }}
    >
      <DappFavicon
        className={styles.dappIcon}
        origin={dapp.origin}
        src={dapp.faviconBase64 ? dapp.faviconBase64 : dapp.faviconUrl}
      />
      <div className={styles.dappContent}>
        <div className={styles.dappName}>{dapp.alias}</div>
        <div className={styles.dappOrigin}>{dapp.origin}</div>
      </div>
      <div className={styles.dappExtra}>
        <Checkbox checked={checked} />
      </div>
    </div>
  );
};

const DappCardAdd = ({ onClick }: { onClick?: () => void }) => {
  return (
    <div className={classNames(styles.dapp, styles.dappAdd)} onClick={onClick}>
      <img src="rabby-internal://assets/icons/associate-dapp/plus.svg" alt="" />
      <div className={styles.dappContent}>Add a dapp</div>
    </div>
  );
};

const AssociateDapp = ({
  protocolId,
  url,
  onOk,
}: {
  protocolId: string;
  url: string;
  onOk?: (origin: string) => void;
}) => {
  const { dapps } = useDapps();
  const [current, setCurrent] = useState('');
  const [isShowAdd, setIsShowAdd] = useState(false);
  const { bindingDappsToProtocol, protocolDappsBinding } =
    useProtocolDappsBinding();
  const [loading, setLoading] = useState(false);

  console.log(protocolDappsBinding);

  const dappList = useMemo(() => {
    try {
      const { origin } = new URL(url);

      const index = dapps.findIndex((dapp) => {
        return dapp.origin === origin;
      });
      if (index === -1) {
        return dapps;
      }
      const _dapps = [...dapps];
      const dapp = dapps[index];
      _dapps.splice(index, 1);
      _dapps.unshift(dapp);
      return _dapps;
    } catch (e) {
      return dapps;
    }
  }, [url, dapps]);

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await bindingDappsToProtocol(protocolId, current);
      onOk?.(current);
    } catch (e: any) {
      message.error(e.message);
    }
    setLoading(false);
  };
  return (
    <>
      <div className={styles.associateDapp}>
        <div className={styles.associateDappHeader}>
          <div className={styles.associateDappTitle}>
            Associate current protocol with your Dapp
          </div>
          <div className={styles.associateDappDesc}>
            By associating the current protocol with your Dapp, you can access
            the Dapp by clicking the protocol.
          </div>
        </div>
        <div className={styles.associateDappBody}>
          <div className={styles.dappContainer}>
            {dappList.map((dapp) => {
              return (
                <DappCard
                  dapp={dapp}
                  key={dapp.origin}
                  checked={dapp.origin === current}
                  onSelect={(_dapp) => {
                    setCurrent(_dapp.origin);
                  }}
                />
              );
            })}
            <DappCardAdd
              onClick={() => {
                setIsShowAdd(true);
              }}
            />
          </div>
        </div>
        <div className={styles.associateDappFooter}>
          <Button
            type="primary"
            block
            size="large"
            className={styles.button}
            disabled={!current}
            loading={loading}
            onClick={handleConfirm}
          >
            Confirm
          </Button>
        </div>
      </div>
      <ModalAddDapp
        open={isShowAdd}
        onCancel={() => {
          setIsShowAdd(false);
        }}
        onAddedDapp={(origin) => {
          setIsShowAdd(false);
          setCurrent(origin);
        }}
      />
    </>
  );
};

export default function AssociateDappModal({
  onOk,
  url,
  protocolId,
  ...modalProps
}: React.PropsWithChildren<
  ModalProps & {
    protocolId: string;
    url: string;
    onOk?: (origin: string) => void;
  }
>) {
  return (
    <Modal
      width={1000}
      centered
      {...modalProps}
      onCancel={(e) => {
        modalProps.onCancel?.(e);
      }}
      footer={null}
      className={classNames(styles.modal, modalProps.className)}
      wrapClassName={classNames(modalProps.wrapClassName)}
      destroyOnClose
    >
      <AssociateDapp protocolId={protocolId} url={url} onOk={onOk} />
    </Modal>
  );
}
