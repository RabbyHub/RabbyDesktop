import React, { useCallback, useState } from 'react';
import classnames from 'classnames';
import { Input, Modal, ModalProps, Button } from 'antd';

import styles from './index.module.less';
import { useDapps } from 'renderer/hooks/usePersistData';

type IStep = 'add' | 'checked'

const UNISWAP_INFO = {
  faviconUrl: 'rabby-internal://assets/icons/samples/icon-sample-uniswap.svg',
  url: 'https://app.uniswap.org'
} as const

type ICheckResult = {
  result: { faviconUrl: string, url: string } | null
  errorMessage: string | null;
};

function useAddStep (onChecking: (result: ICheckResult) => void) {
  // const [addUrl, setAddUrl] = useState('https://');
  const [addUrl, setAddUrl] = useState<string>(UNISWAP_INFO.url);

  const onChangeAddUrl = useCallback((evt: React.ChangeEvent<HTMLInputElement>) => {
    setAddUrl(evt.target.value);
  }, []);

  const [isCheckingUrl, setIsChecking] = useState(false);
  // mock
  const doCheckUrl = useCallback(() => {
    setIsChecking(true);

    const timer = setTimeout(() => {
      setIsChecking(false);
      onChecking({
        result: {
          url: addUrl,
          faviconUrl: 'rabby-internal://assets/icons/samples/icon-sample-uniswap.svg'
        },
        // TODO:
        // The HTTPS protocol for this URL has expired
        // This Dapp is inaccessible. It may be an invalid URL
        // Dapp with protocols other than HTTPS is not supported
        errorMessage: null
      });
    }, 500);

    // return dispose
    return () => {
      clearTimeout(timer);
    }
  }, [ addUrl, onChecking ])

  return {
    isCheckingUrl,
    doCheckUrl,
    addUrl,
    onChangeAddUrl,
    isValidAddUrl: /https:\/\/.+/.test(addUrl),
  }
}

function useCheckedStep () {
  const [dappInfo, setDappInfo] = useState<IDapp>({
    alias: '',
    url: '',
    faviconUrl: ''
  });
  // const [dappAlias, setAlias] = useState('uniswap');

  const onChangeDappAlias = useCallback((evt: React.ChangeEvent<HTMLInputElement>) => {
    setDappInfo(prev => {
      return { ...prev, alias: evt.target.value }
    });
  }, []);

  return {
    dappInfo,
    setDappInfo,
    onChangeDappAlias,
    isValidAlias: /[\w\d]+/.test(dappInfo.alias),
  }
}

export default function ModalAddDapp ({
  onAddedDapp,
  ...modalProps
}: React.PropsWithChildren<ModalProps & {
  onAddedDapp?: () => void
}>) {
  const [step, setStep] = useState<IStep>('add');
  // const [step, setStep] = useState<IStep>('checked');

  const onChecking = useCallback((payload: ICheckResult) => {
    if (payload.result) {
      setStep('checked');
      setDappInfo({ alias: '', ...payload.result })
    }
  }, [])

  const {
    addUrl,
    onChangeAddUrl,
    isValidAddUrl,
    isCheckingUrl,
    doCheckUrl,
  } = useAddStep(onChecking);

  const {
    dappInfo,
    setDappInfo,
    onChangeDappAlias,
    isValidAlias,
  } = useCheckedStep();

  const { updateDapp } = useDapps();

  return (
    <Modal
      centered
      // title="Basic Modal"
      {...modalProps}
      title={null}
      footer={null}
      className={classnames(styles.modal, modalProps.className)}
      wrapClassName={classnames('modal-dapp-mngr', modalProps.wrapClassName)}
      // onOk={handleOk}
      // onCancel={handleCancel}
    >
      {step === 'add' && (
        <div className={styles.stepAdd}>
          <h3 className={styles.addTitle}>
            Enter or copy the Dapp URL
          </h3>
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
            onClick={() => doCheckUrl()}
          >
            Check
          </Button>
        </div>
      )}
      {step === 'checked' && (
        <div className={styles.stepChecked}>
          <img className={styles.checkedFavicon} src={UNISWAP_INFO.faviconUrl} />
          <span className={styles.checkedDappUrl}>{UNISWAP_INFO.url}</span>

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
              await updateDapp(dappInfo).then(() => {
                onAddedDapp?.()
              })
            }}
            disabled={!isValidAlias}
          >
            Confirm
          </Button>
        </div>
      )}
    </Modal>
  )
}
