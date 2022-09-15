import React, { useCallback, useRef, useState } from 'react';
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
    dapp: IDapp;
    onRenamedDapp?: () => void;
  }
>) {
  const { alias, onAliasChange, isValidAlias, doRename, isLoading } =
    useRename(dapp);

  // dynamic styles
  const nameRef: React.MutableRefObject<HTMLSpanElement | null> =
    useRef<HTMLSpanElement>(null);
  const [oldNameW, setOldNameW] = useState(0);

  if (!dapp) return null;

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
      <div className={styles.renameDapp}>
        <img
          className={styles.dappFavicon}
          src={dapp?.faviconUrl}
          alt={dapp?.faviconUrl}
        />
        <span className={styles.dappUrl}>{dapp?.url}</span>
        <div className={styles.modifyWrapper}>
          <span
            ref={(el) => {
              nameRef.current = el;
              setOldNameW(el?.getBoundingClientRect().width || 0);
              return el;
            }}
            className={styles.oldAlias}
          >
            {dapp?.alias}
          </span>
          <Input
            className={styles.aliasInput}
            style={{
              ...(oldNameW && { paddingLeft: oldNameW }),
            }}
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
