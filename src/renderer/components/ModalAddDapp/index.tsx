import React, { useCallback, useState } from 'react';
import classnames from 'classnames';
import { Input, Modal, ModalProps, Button, message } from 'antd';

import { useDapps } from 'renderer/hooks/useDappsMngr';
import styles from './index.module.less';
import { isValidDappAlias } from '../../../isomorphic/dapp';
import { IS_RUNTIME_PRODUCTION } from '../../../isomorphic/constants';
import { RCIconDappsModalClose } from '../../../../assets/icons/internal-homepage';

type IStep = 'add' | 'checked';

const UNISWAP_INFO = {
  faviconUrl: 'rabby-internal://assets/icons/samples/icon-sample-uniswap.svg',
  url: 'https://app.uniswap.org',
} as const;

type ICheckResult = {
  result: { faviconUrl: string; url: string } | null;
  errorMessage: string | null;
};

function useAddStep() {
  const [addUrl, setAddUrl] = useState(
    IS_RUNTIME_PRODUCTION ? 'https://' : UNISWAP_INFO.url
  );
  // const [addUrl, setAddUrl] = useState<string>(UNISWAP_INFO.url);

  const onChangeAddUrl = useCallback(
    (evt: React.ChangeEvent<HTMLInputElement>) => {
      setAddUrl(evt.target.value);
    },
    []
  );

  const [isCheckingUrl, setIsChecking] = useState(false);
  // mock
  const checkUrl = useCallback(async () => {
    setIsChecking(true);

    return new Promise<ICheckResult>((resolve) => {
      setTimeout(() => {
        setIsChecking(false);
        resolve({
          result: {
            url: addUrl,
            faviconUrl:
              'rabby-internal://assets/icons/samples/icon-sample-uniswap.svg',
          },
          // TODO:
          // The HTTPS protocol for this URL has expired
          // This Dapp is inaccessible. It may be an invalid URL
          // Dapp with protocols other than HTTPS is not supported
          errorMessage: null,
        });
      }, 500);
    });
  }, [addUrl]);

  return {
    isCheckingUrl,
    checkUrl,
    addUrl,
    onChangeAddUrl,
    isValidAddUrl: /https:\/\/.+/.test(addUrl),
  };
}

function useCheckedStep() {
  const [dappInfo, setDappInfo] = useState<IDapp>({
    alias: '',
    url: '',
    faviconUrl: '',
  });
  const onChangeDappAlias = useCallback(
    (evt: React.ChangeEvent<HTMLInputElement>) => {
      setDappInfo((prev) => {
        return { ...prev, alias: evt.target.value };
      });
    },
    []
  );

  return {
    dappInfo,
    setDappInfo,
    onChangeDappAlias,
    isValidAlias: isValidDappAlias(dappInfo.alias),
  };
}

export default function ModalAddDapp({
  onAddedDapp,
  ...modalProps
}: React.PropsWithChildren<
  ModalProps & {
    onAddedDapp?: () => void;
  }
>) {
  const [step, setStep] = useState<IStep>('add');

  const { addUrl, onChangeAddUrl, isValidAddUrl, isCheckingUrl, checkUrl } =
    useAddStep();

  const { dappInfo, setDappInfo, onChangeDappAlias, isValidAlias } =
    useCheckedStep();

  const { updateDapp } = useDapps();

  const doCheck = useCallback(async () => {
    const payload = await checkUrl();

    if (payload.result) {
      setStep('checked');
      setDappInfo({ alias: '', ...payload.result });
    } else {
      message.error(payload.errorMessage);
    }
  }, [checkUrl, setDappInfo]);

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
      {step === 'add' && (
        <div className={styles.stepAdd}>
          <h3 className={styles.addTitle}>Enter or copy the Dapp URL</h3>
          <Input
            className={styles.addUrlInput}
            value={addUrl}
            onChange={onChangeAddUrl}
            placeholder="https://somedapp.xyz"
          />
          <Button
            loading={isCheckingUrl}
            type="primary"
            disabled={!isValidAddUrl}
            className={styles.addConfirmBtn}
            onClick={doCheck}
          >
            Check
          </Button>
        </div>
      )}
      {step === 'checked' && (
        <div className={styles.stepChecked}>
          <img
            className={styles.checkedFavicon}
            src={dappInfo.faviconUrl}
            alt={dappInfo.faviconUrl}
          />
          <span className={styles.checkedDappUrl}>{dappInfo.url}</span>

          <Input
            className={styles.checkedInput}
            value={dappInfo.alias}
            onChange={onChangeDappAlias}
            placeholder="Please name the dapp"
          />
          <Button
            type="primary"
            className={styles.checkedConfirmBtn}
            onClick={async () => {
              await updateDapp(dappInfo);
              onAddedDapp?.();
            }}
            disabled={!isValidAlias}
          >
            Confirm
          </Button>
        </div>
      )}
    </Modal>
  );
}
