import React, { useCallback, useEffect, useRef, useState } from 'react';
import classnames from 'classnames';
import { Input, Modal, ModalProps, Button } from 'antd';
import { useDapps } from 'renderer/hooks/usePersistData';
import { isValidDappAlias } from '../../../isomorphic/dapp';

import styles from './index.module.less';
import { RCIconDappsModalClose } from '../../../../assets/icons/internal-homepage';

const ALIAS_LIMIT = 15;

function useRename(dapp: IDapp | null) {
  const [alias, setAlias] = useState<string>(dapp?.alias || '');

  const onAliasChange = useCallback(
    (evt: React.ChangeEvent<HTMLInputElement>) => {
      setAlias(evt.target.value);
    },
    []
  );

  const { renameDapp } = useDapps();

  const [isLoading, setIsLoading] = useState(false);

  const doRename = useCallback(async () => {
    if (!dapp) {
      throw new Error('[doRename] dapp is null');
    }
    setIsLoading(true);
    await renameDapp(dapp, alias).finally(() => setIsLoading(false));
  }, [renameDapp, dapp, alias]);

  useEffect(() => {
    if (dapp) {
      setAlias(dapp.alias || '');
    }
  }, [dapp]);

  return {
    alias,
    onAliasChange,
    doRename,
    isLoading,
    isValidAlias:
      alias.length <= ALIAS_LIMIT &&
      isValidDappAlias(alias) &&
      alias !== dapp?.alias,
  };
}

export default function ModalRenameDapp({
  dapp,
  onRenamedDapp,
  ...modalProps
}: React.PropsWithChildren<
  ModalProps & {
    dapp: IDapp | null;
    onRenamedDapp?: () => void;
  }
>) {
  const { alias, onAliasChange, isValidAlias, doRename, isLoading } =
    useRename(dapp);

  return (
    <Modal
      width={560}
      centered
      {...modalProps}
      title={null}
      footer={null}
      closeIcon={<RCIconDappsModalClose />}
      className={classnames(styles.renameModal, modalProps.className)}
      wrapClassName={classnames('modal-dapp-mngr', modalProps.wrapClassName)}
    >
      <div className={styles.renameDapp}>
        <img
          className={styles.dappFavicon}
          src={dapp?.faviconUrl}
          alt={dapp?.faviconUrl}
        />
        <div className={styles.dappUrl} title={dapp?.url}>
          {dapp?.url}
        </div>
        <div className={styles.modifyWrapper}>
          <Input
            className={styles.aliasInput}
            value={alias}
            onChange={onAliasChange}
            // placeholder="https://somedapp.xyz"
          />
        </div>
        <Button
          loading={isLoading}
          type="primary"
          disabled={!isValidAlias}
          className={styles.confirmBtn}
          onClick={async () => {
            await doRename();
            onRenamedDapp?.();
          }}
        >
          Confirm
        </Button>
      </div>
    </Modal>
  );
}
