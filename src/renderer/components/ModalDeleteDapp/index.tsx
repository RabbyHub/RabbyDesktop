import React, { useCallback, useState } from 'react';
import classnames from 'classnames';
import { ModalProps, Button } from 'antd';

import { useDapps } from 'renderer/hooks/useDappsMngr';
import { permissionService } from '@/renderer/ipcRequest/rabbyx';
import { navigateToDappRoute } from '@/renderer/utils/react-router';
import { useNavigate } from 'react-router-dom';
import { useZPopupViewState } from '@/renderer/hooks/usePopupWinOnMainwin';
import styles from './index.module.less';
import { DappFavicon } from '../DappFavicon';
import { Modal } from '../Modal/Modal';

function useDelete(dapp: IDapp | null) {
  const { removeDapp } = useDapps();

  const [isLoading, setIsLoading] = useState(false);

  const doDelete = useCallback(async () => {
    if (!dapp) {
      throw new Error('[doDelete] dapp is null');
    }
    setIsLoading(true);
    await permissionService.removeConnectedSite(dapp.origin);
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
    dapp: IDapp | null;
    onDeletedDapp?: () => void;
    onCancel?: () => void;
  }
>) {
  const { doDelete, isLoading } = useDelete(dapp);
  const navigate = useNavigate();

  if (!dapp) return null;

  return (
    <Modal
      width={560}
      centered
      {...modalProps}
      title={null}
      footer={null}
      className={classnames(styles.deleteModal, modalProps.className)}
      wrapClassName={classnames(modalProps.wrapClassName)}
    >
      <div className={styles.deletingDapp}>
        <h3 className={styles.title}>Confirm to delete?</h3>
        <div className="dapp-block-wrapper">
          <div className="dapp-block">
            <a
              className="anchor"
              href={dapp.origin}
              target="_blank"
              rel="noreferrer"
              onClick={() => {
                navigateToDappRoute(navigate, dapp.origin);
              }}
            >
              <DappFavicon
                origin={dapp.origin}
                className="dapp-favicon"
                src={dapp.faviconBase64 ? dapp.faviconBase64 : dapp.faviconUrl}
                alt="add"
              />
              <div className="infos">
                <h4 className="dapp-alias">{dapp.alias}</h4>
                <div className="dapp-url">
                  {dapp.origin?.replace(/^\w+:\/\//, '')}
                </div>
              </div>
            </a>
          </div>
        </div>
        <p className={styles.tips}>
          Your records will be erased after deletion.
        </p>
        <Button
          loading={isLoading}
          type="primary"
          className={styles.button}
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

export const DeleteDappModal = () => {
  const { svVisible, svState, closeSubview } =
    useZPopupViewState('delete-dapp-modal');

  if (!svState?.dapp) return null;

  return (
    <ModalDeleteDapp
      dapp={svState.dapp}
      open={svVisible}
      onCancel={closeSubview}
      onDeletedDapp={closeSubview}
    />
  );
};
