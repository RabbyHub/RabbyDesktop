import React, { useCallback, useState } from 'react';
import classnames from 'classnames';
import { Input, ModalProps, Button, message, Form } from 'antd';
import { ExclamationCircleFilled } from '@ant-design/icons';

import { useDapps } from 'renderer/hooks/useDappsMngr';
import { makeSureDappAddedToConnectedSite } from '@/renderer/ipcRequest/connected-site';
import { useNavigate } from 'react-router-dom';
import { navigateToDappRoute } from '@/renderer/utils/react-router';
import { addDapp } from '@/renderer/ipcRequest/dapps';
import { Modal } from '../Modal/Modal';
import styles from './index.module.less';
import { isValidDappAlias } from '../../../isomorphic/dapp';
import { IS_RUNTIME_PRODUCTION } from '../../../isomorphic/constants';
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

export function AddDapp({
  onAddedDapp,
  ...modalProps
}: ModalProps & {
  onAddedDapp?: (origin: string) => void;
}) {
  const [step, setStep] = useState<IStep>('add');
  const navigate = useNavigate();

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

  const [duplicatedDapp, setDuplicatedDapp] = useState<IDapp | null>(null);

  const doCheck = useCallback(async () => {
    setCheckError(null);

    const payload = await checkUrl();

    if (payload?.error?.type === 'REPEAT') {
      setStep('duplicated');

      setDuplicatedDapp({
        alias: '',
        origin: payload.data!.origin,
        faviconUrl: payload.data!.faviconUrl,
        faviconBase64: payload.data!.faviconBase64,
      });
      return;
    }

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
  }, [checkUrl, setCheckError, setDappInfo]);

  return (
    <div className={styles.step}>
      {step !== 'add' && (
        <img
          onClick={() => {
            setStep('add');
          }}
          className={styles.backIcon}
          src="rabby-internal://assets/icons/modal/back.svg"
        />
      )}
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
              className={styles.input}
              value={addUrl}
              onChange={onChangeAddUrl}
              placeholder="https://somedapp.xyz"
              allowClear
              autoFocus
            />
          </Form.Item>
          <Button
            loading={isCheckingUrl}
            type="primary"
            htmlType="submit"
            disabled={!isValidAddUrl}
            className={styles.button}
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
            className={styles.input}
            value={dappInfo.alias}
            onChange={onChangeDappAlias}
            placeholder="Please name the dapp"
            allowClear
          />
          <Button
            type="primary"
            className={styles.button}
            onClick={async () => {
              await makeSureDappAddedToConnectedSite(dappInfo);
              await addDapp(dappInfo);
              // message.success('Added successfully');
              onAddedDapp?.(dappInfo.origin);
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
              onClick={() => {
                navigateToDappRoute(navigate, duplicatedDapp.origin);
              }}
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
            className={styles.button}
            disabled
          >
            Confirm
          </Button>
        </div>
      )}
    </div>
  );
}

export default function ModalAddDapp({
  onAddedDapp,
  ...modalProps
}: React.PropsWithChildren<
  ModalProps & {
    onAddedDapp?: (origin: string) => void;
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
      title={null}
      footer={null}
      className={classnames(styles.addModal, modalProps.className)}
      wrapClassName={classnames(modalProps.wrapClassName)}
      destroyOnClose
      onBack={() => {}}
    >
      <AddDapp onAddedDapp={onAddedDapp} {...modalProps} />
    </Modal>
  );
}
