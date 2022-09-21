import React, { useCallback, useEffect, useState } from 'react';
import classnames from 'classnames';
import { Input, Modal, ModalProps, Button, message, Form } from 'antd';
import { ExclamationCircleFilled } from '@ant-design/icons';

import { useDapps } from 'renderer/hooks/useDappsMngr';
import styles from './index.module.less';
import { isValidDappAlias } from '../../../isomorphic/dapp';
import { IS_RUNTIME_PRODUCTION } from '../../../isomorphic/constants';
import { RCIconDappsModalClose } from '../../../../assets/icons/internal-homepage';
import { DappFavicon } from '../DappFavicon';

type IStep = 'add' | 'checked' | 'duplicated';

function useAddStep() {
  const { detectDapps } = useDapps();
  // eslint-disable-next-line @typescript-eslint/naming-convention
  const [_checkError, setCheckError] = useState<string | null>(null);

  const [addUrl, setAddUrl] = useState(
    IS_RUNTIME_PRODUCTION ? 'https://' : 'https://debank.com'
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

    try {
      const result = await detectDapps(addUrl);
      return result;
    } catch (e: any) {
      message.error(e.message);
      return;
    } finally {
      setIsChecking(false);
    }
  }, [addUrl, detectDapps]);

  const resetChecking = useCallback(() => {
    setIsChecking(false);
  }, []);

  const isValidAddUrl = /https:\/\/.+/.test(addUrl);
  // const checkError = !isValidAddUrl
  //   ? 'Dapp with protocols other than HTTPS is not supported'
  //   : _checkError;
  const checkError = _checkError;

  return {
    isCheckingUrl,
    checkUrl,
    resetChecking,
    addUrl,
    onChangeAddUrl,
    isValidAddUrl,
    checkError,
    setCheckError,
    setAddUrl,
  };
}

function useCheckedStep() {
  const [dappInfo, setDappInfo] = useState<IDapp>({
    alias: '',
    origin: '',
    faviconUrl: '',
    faviconBase64: '',
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

const useDuplicateStep = () => {
  const { getDapp } = useDapps();
  const [duplicatedDapp, setDuplicatedDapp] = useState<IDapp | null>(null);
  const checkDuplicate = useCallback(
    (url: string) => {
      const { origin } = new URL(url);
      const dapp = getDapp(origin);
      setDuplicatedDapp(dapp || null);
      return !!dapp;
    },
    [getDapp]
  );
  return {
    duplicatedDapp,
    checkDuplicate,
  } as const;
};

function AddDapp({
  onAddedDapp,
  ...modalProps
}: ModalProps & {
  onAddedDapp?: () => void;
}) {
  const [step, setStep] = useState<IStep>('add');

  const {
    addUrl,
    onChangeAddUrl,
    isValidAddUrl,
    isCheckingUrl,
    checkUrl,
    checkError,
    setCheckError,
  } = useAddStep();

  const { dappInfo, setDappInfo, onChangeDappAlias, isValidAlias } =
    useCheckedStep();

  const { duplicatedDapp, checkDuplicate } = useDuplicateStep();

  const { updateDapp } = useDapps();

  const doCheck = useCallback(async () => {
    if (checkDuplicate(addUrl)) {
      setStep('duplicated');
      return;
    }

    setCheckError(null);

    const payload = await checkUrl();

    setCheckError(payload?.error?.message || null);

    if (payload?.data) {
      setStep('checked');
      setDappInfo({
        alias: '',
        origin: payload.data.origin,
        faviconUrl: payload.data.faviconUrl,
        faviconBase64: payload.data.faviconBase64,
      });
    }
  }, [addUrl, checkDuplicate, checkUrl, setCheckError, setDappInfo]);

  return (
    <>
      {step === 'add' && (
        <Form className={styles.stepAdd} onFinish={doCheck}>
          <h3 className={styles.addTitle}>Enter or copy the Dapp URL</h3>
          <Form.Item
            name="url"
            validateStatus={checkError ? 'error' : undefined}
            help={checkError}
            // validateTrigger="onBlur"
            rules={[
              {
                pattern: /^https:\/\/.+/,
                message:
                  'Dapp with protocols other than HTTPS is not supported',
              },
            ]}
          >
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
          <DappFavicon
            origin={dappInfo.origin}
            className={styles.checkedFavicon}
            src={
              dappInfo.faviconBase64
                ? dappInfo.faviconBase64
                : dappInfo.faviconUrl
            }
            alt={dappInfo.faviconUrl}
          />
          <span className={styles.checkedDappUrl}>{dappInfo.origin}</span>

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
      {step === 'duplicated' && duplicatedDapp && (
        <div className={styles.stepDuplicated}>
          <div className={styles.stepDuplicatedTips}>
            <ExclamationCircleFilled />
            You have added the dapp
          </div>
          <div className="dapp-block">
            <a
              className="anchor"
              href={duplicatedDapp?.origin}
              target="_blank"
              rel="noreferrer"
            >
              {/* TODO: robust about load image */}
              <DappFavicon
                origin={duplicatedDapp?.origin}
                className="dapp-favicon"
                src={
                  duplicatedDapp?.faviconBase64 || duplicatedDapp?.faviconUrl
                }
                alt="duplicatedDapp?.origin"
              />
              <div className="infos">
                <h4 className="dapp-alias" title={duplicatedDapp?.alias}>
                  {duplicatedDapp?.alias}
                </h4>
                <div className="dapp-url" title={duplicatedDapp?.origin}>
                  {duplicatedDapp?.origin}
                </div>
              </div>
            </a>
          </div>
          <Button
            type="primary"
            onClick={(e) => {
              modalProps.onCancel?.(e);
            }}
            className={styles.stepDuplicatedBtn}
            disabled
          >
            Confirm
          </Button>
        </div>
      )}
    </>
  );
}

export default function ModalAddDapp({
  onAddedDapp,
  ...modalProps
}: React.PropsWithChildren<
  ModalProps & {
    onAddedDapp?: () => void;
  }
>) {
  return (
    <Modal
      width={800}
      centered
      {...modalProps}
      onCancel={(e) => {
        modalProps.onCancel?.(e);
      }}
      title={null}
      footer={null}
      closeIcon={<RCIconDappsModalClose />}
      className={classnames(styles.addModal, modalProps.className)}
      wrapClassName={classnames('modal-dapp-mngr', modalProps.wrapClassName)}
      destroyOnClose
    >
      <AddDapp onAddedDapp={onAddedDapp} {...modalProps} />
    </Modal>
  );
}
