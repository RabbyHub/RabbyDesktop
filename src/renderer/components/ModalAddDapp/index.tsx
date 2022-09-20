import React, { useCallback, useEffect, useState } from 'react';
import classnames from 'classnames';
import { Input, Modal, ModalProps, Button, message, Form } from 'antd';
import { ExclamationCircleFilled } from '@ant-design/icons';

import { useDapps } from 'renderer/hooks/usePersistData';
import styles from './index.module.less';
import { isValidDappAlias } from '../../../isomorphic/dapp';
import { IS_RUNTIME_PRODUCTION } from '../../../isomorphic/constants';
import { RCIconDappsModalClose } from '../../../../assets/icons/internal-homepage';

type IStep = 'add' | 'checked' | 'duplicated';

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
  const { open } = modalProps;
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

  useEffect(() => {
    if (!open) {
      setStep('add');
    }
  }, [open]);

  // todo
  const dapp: any = { ...UNISWAP_INFO, alias: 'abc' };

  return (
    <Modal
      width={800}
      centered
      {...modalProps}
      title={null}
      footer={null}
      closeIcon={<RCIconDappsModalClose />}
      className={classnames(styles.addModal, modalProps.className)}
      wrapClassName={classnames('modal-dapp-mngr', modalProps.wrapClassName)}
    >
      {step === 'add' && (
        <Form className={styles.stepAdd} onFinish={doCheck}>
          <h3 className={styles.addTitle}>Enter or copy the Dapp URL</h3>
          <Form.Item name="url" rules={[{ required: true }]}>
            <Input
              className={styles.addUrlInput}
              value={addUrl}
              onChange={onChangeAddUrl}
              placeholder="https://somedapp.xyz"
              allowClear
            />
          </Form.Item>
          <Button
            loading={isCheckingUrl}
            type="primary"
            htmlType="submit"
            disabled={!isValidAddUrl}
            className={styles.addConfirmBtn}
          >
            Check
          </Button>
        </Form>
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
            allowClear
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
      {step === 'duplicated' && (
        <div className={styles.stepDuplicated}>
          <div className={styles.stepDuplicatedTips}>
            <ExclamationCircleFilled />
            You have added the dapp
          </div>
          <div className="dapp-block">
            <a
              className="anchor"
              href={dapp?.url}
              target="_blank"
              rel="noreferrer"
            >
              {/* TODO: robust about load image */}
              <img className="dapp-favicon" src={dapp?.faviconUrl} alt="add" />
              <div className="infos">
                <h4 className="dapp-alias" title={dapp?.alias}>
                  {dapp?.alias}
                </h4>
                <div className="dapp-url" title={dapp?.url}>
                  {dapp?.url}
                </div>
              </div>
            </a>
          </div>
          <Button type="primary" disabled className={styles.stepDuplicatedBtn}>
            Confirm
          </Button>
        </div>
      )}
    </Modal>
  );
}
