import React, { useCallback, useState } from 'react';
import classnames from 'classnames';
import { Modal, ModalProps, Button } from 'antd';

import { useDapps } from 'renderer/hooks/usePersistData';
import styles from './index.module.less';
import { RCIconDappsModalClose } from '../../../../assets/icons/internal-homepage';

function useDelete(dapp: IDapp | null) {
  const { removeDapp } = useDapps();

  const [isLoading, setIsLoading] = useState(false);

  const doDelete = useCallback(async () => {
    if (!dapp) {
      throw new Error('[doDelete] dapp is null');
    }
    setIsLoading(true);
    await removeDapp(dapp).finally(() => setIsLoading(false));
  }, [removeDapp, dapp]);

  return {
    doDelete,
    isLoading,
  };
}

export default function ModalDeleteDapp({
  dapp,
  onDeletedDapp,
  ...modalProps
}: React.PropsWithChildren<
  ModalProps & {
    dapp: IDapp;
    onDeletedDapp?: () => void;
  }
>) {
  const { doDelete, isLoading } = useDelete(dapp);

  return (
    <Modal
      centered
      {...modalProps}
      title={null}
      footer={null}
      closeIcon={<RCIconDappsModalClose />}
      className={classnames(styles.modal, modalProps.className)}
      wrapClassName={classnames('modal-dapp-mngr', modalProps.wrapClassName)}
    >
      <div className={styles.deletingDapp}>
        <h3 className={styles.title}>Delete the Dapp?</h3>
        <div className="dapp-block-wrapper">
          <div className="dapp-block">
            <a
              className="anchor"
              href={dapp.url}
              target="_blank"
              rel="noreferrer"
            >
              {/* TODO: robust about load image */}
              <img className="dapp-favicon" src={dapp.faviconUrl} alt="add" />
              <div className="infos">
                <h4 className="dapp-alias">{dapp.alias}</h4>
                <span className="dapp-url">{dapp.url}</span>
              </div>
            </a>
          </div>
        </div>
        <p className={styles.tips}>
          Deleting the Dapp will also erase your records here.
        </p>
        <Button
          loading={isLoading}
          type="primary"
          className={styles.confirmBtn}
          onClick={async () => {
            await doDelete();
            onDeletedDapp?.();
          }}
        >
          Confirm
        </Button>
      </div>
    </Modal>
  );
}
