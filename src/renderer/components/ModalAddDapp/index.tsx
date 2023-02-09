import { Button, Form, Input, message, ModalProps } from 'antd';
import React, { useCallback, useEffect, useState } from 'react';

import classNames from 'classnames';
import { useNavigate } from 'react-router-dom';
import { useDapps } from 'renderer/hooks/useDappsMngr';
import { isValidDappAlias } from '../../../isomorphic/dapp';
import { DappFavicon } from '../DappFavicon';
import { Modal } from '../Modal/Modal';
import styles from './index.module.less';
import { useAddDappURL } from './useAddDapp';

type IStep = 'add' | 'checked' | 'duplicated';

function useAddStep() {
  const { detectDapps } = useDapps();
  // eslint-disable-next-line @typescript-eslint/naming-convention
  const [_checkError, setCheckError] = useState<string | null>(null);

  const [addUrl, setAddUrl] = useAddDappURL();
  const [addStepForm] = Form.useForm<{ url: string }>();
  useEffect(() => {
    addStepForm.setFieldsValue({ url: addUrl });
  }, [addUrl]);

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
    addStepForm,
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

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface PreviewDappProps {}
const PreviewDapp = (props: PreviewDappProps) => {
  return (
    <div className={styles.preview}>
      <div className={styles.previewHeader}>
        <div className={styles.previewIcon}>todo</div>
        <div>
          <div className={styles.previewTitle}>
            <Input />
          </div>
          <div className={styles.previewDesc}>uniswap.org/</div>
        </div>
        <div className={styles.previewAction}>
          <Button type="primary">Add</Button>

          {/* <Button type="primary">Open</Button>
          <LoadingOutlined /> */}
        </div>
      </div>
      <iframe
        className={styles.previewContent}
        src="https://app.uniswap.org"
        title="debank"
      />
      {/* <div className={styles.previewEmpty}>
        <div>
          <img
            src="rabby-internal://assets/icons/add-dapp/icon-failed.svg"
            alt=""
          />
          <div className={styles.previewEmptyTitle}>网页缩略图加载失败</div>
        </div>
      </div> */}
    </div>
  );
};

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface DappCardProps {
  dapp?: IMergedDapp;
}
const DappCard = ({ dapp }: DappCardProps) => {
  return (
    <div className={classNames(styles.dapp)}>
      <DappFavicon
        className={styles.dappIcon}
        origin={dapp?.origin || ''}
        src={dapp?.faviconBase64 ? dapp.faviconBase64 : dapp?.faviconUrl}
      />
      <div className={styles.dappContent}>
        <div className={styles.dappName}>{dapp?.alias}</div>
        <div className={styles.dappOrigin}>{dapp?.origin}</div>
      </div>
    </div>
  );
};

const RelationModal = () => {
  return (
    <Modal open className={styles.relationModal} width={500}>
      <div className={styles.content}>
        <div className={styles.title}>
          There is an inclusion relationship with the domain name of the added
          Dapp. The following Dapp will be replaced after adding.
        </div>
        <div className={styles.body}>
          <DappCard />
        </div>
        <div className={styles.footer}>
          <Button ghost block size="large">
            Cancel adding
          </Button>
          <Button type="primary" block size="large">
            Confirm to add
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export function AddDapp({
  onAddedDapp,
  ...modalProps
}: ModalProps & {
  onAddedDapp?: (origin: string) => void;
}) {
  const [step, setStep] = useState<IStep>('add');
  const navigate = useNavigate();

  const {
    addStepForm,
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
        origin: payload.data!.inputOrigin,
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
        origin: payload.data.inputOrigin,
        faviconUrl: payload.data.faviconUrl,
        faviconBase64: payload.data.faviconBase64,
      });
    }
  }, [checkUrl, setCheckError, setDappInfo]);

  return (
    <div className={styles.content}>
      <h3 className={styles.title}>Enter the Dapp domain name</h3>
      <Form form={addStepForm} className={styles.form} onFinish={doCheck}>
        <Form.Item
          name="url"
          validateStatus={checkError ? 'error' : undefined}
          help={
            checkError ||
            'To ensure the security of your funds, please ensure that you enter the official domain name of Dapp'
          }
          // validateTrigger="onBlur"
          rules={[
            {
              pattern: /^https:\/\/.+/,
              message: 'Dapp with protocols other than HTTPS is not supported',
            },
          ]}
        >
          <Input
            className={styles.input}
            value={addUrl}
            onChange={onChangeAddUrl}
            placeholder="Input the Dapp domain name. e.g. debank.com"
            autoFocus
            suffix={
              <img
                onClick={() => {
                  // todo
                }}
                src="rabby-internal://assets/icons/add-dapp/icon-search.svg"
              />
            }
          />
        </Form.Item>
      </Form>
      <PreviewDapp />
      {/* <RelationModal /> */}
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
      className={classNames(styles.addModal, modalProps.className)}
      wrapClassName={classNames(modalProps.wrapClassName)}
      destroyOnClose
      onBack={() => {}}
    >
      <AddDapp onAddedDapp={onAddedDapp} {...modalProps} />
    </Modal>
  );
}
