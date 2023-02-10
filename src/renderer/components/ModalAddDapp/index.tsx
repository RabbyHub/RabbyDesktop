import { Button, Form, Input, message, ModalProps } from 'antd';
import React, { useCallback, useEffect, useState } from 'react';

import { getDomainFromHostname, canoicalizeDappUrl } from '@/isomorphic/url';
import { addDapp } from '@/renderer/ipcRequest/dapps';
import classNames from 'classnames';
import { useNavigate } from 'react-router-dom';
import { useDapps } from 'renderer/hooks/useDappsMngr';
import { isValidDappAlias } from '../../../isomorphic/dapp';
import { DappFavicon } from '../DappFavicon';
import { Modal } from '../Modal/Modal';
import styles from './index.module.less';
import { useAddDappURL } from './useAddDapp';

type IStep = 'add' | 'checked' | 'duplicated';

const findRelatedDapps = (dapps: IDapp[], url: string) => {
  const current = canoicalizeDappUrl(url);

  // 正在添加 uniswap.org 提示会替换掉 app.uniswap.org
  if (current.is2ndaryDomain) {
    return dapps.filter((dapp) => {
      const result = canoicalizeDappUrl(dapp.origin);
      return result.secondaryDomain === current.secondaryDomain;
    });
  }
  // 正在添加 app.uniswap.org 提示会替换掉uniswap.org
  if (current.isSubDomain) {
    return dapps.filter((dapp) => {
      const result = canoicalizeDappUrl(dapp.origin);
      return (
        result.secondaryDomain === current.secondaryDomain &&
        result.is2ndaryDomain
      );
    });
  }
  return [];
};

function useAddStep() {
  const { detectDapps, dapps } = useDapps();
  console.log(dapps);
  console.log(getDomainFromHostname('baidu.com'));
  const a = findRelatedDapps(dapps || [], 'https://uniswap.org');
  console.log(a);
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
  const [dappInfo, setDappInfo] = useState<IDappsDetectResult['data'] | null>(
    null
  );
  const onChangeDappAlias = useCallback(
    (evt: React.ChangeEvent<HTMLInputElement>) => {
      setDappInfo((prev) => {
        if (prev) {
          return { ...prev, recommendedAlias: evt.target.value };
        }
        return prev;
      });
    },
    []
  );

  return {
    dappInfo,
    setDappInfo,
    onChangeDappAlias,
    isValidAlias: isValidDappAlias(dappInfo?.recommendedAlias || ''),
  };
}

interface PreviewDappProps {
  data: NonNullable<IDappsDetectResult['data']>;
  onAdd: () => void;
}
const PreviewDapp = ({ data, onAdd }: PreviewDappProps) => {
  return (
    <div className={styles.preview}>
      <div className={styles.previewHeader}>
        <DappFavicon
          className={styles.previewIcon}
          origin={data.inputOrigin}
          src={data?.faviconBase64 || data?.faviconUrl}
        />
        <div>
          <div className={styles.previewTitle}>
            <Input defaultValue={data.recommendedAlias} />
          </div>
          <div className={styles.previewDesc}>{data.inputOrigin}</div>
        </div>
        <div className={styles.previewAction}>
          <Button type="primary" onClick={onAdd}>
            Add
          </Button>
          <Button type="primary">Open</Button>
          {/* <LoadingOutlined /> */}
        </div>
      </div>
      <iframe
        className={styles.previewContent}
        src={data.inputOrigin}
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

interface DappCardProps {
  dapp?: IDapp;
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

interface RelationModalProps {
  data: IDapp[];
  open?: boolean;
  onCancel?: () => void;
  onOk?: () => void;
}
const RelationModal = ({ data, open, onCancel, onOk }: RelationModalProps) => {
  return (
    <Modal
      open={open}
      onCancel={onCancel}
      className={styles.relationModal}
      width={500}
    >
      <div className={styles.content}>
        <div className={styles.title}>
          There is an inclusion relationship with the domain name of the added
          Dapp. The following Dapp will be replaced after adding.
        </div>
        <div className={styles.body}>
          {data.map((dapp) => {
            return <DappCard key={dapp.origin} dapp={dapp} />;
          })}
        </div>
        <div className={styles.footer}>
          <Button ghost block size="large" onClick={onCancel}>
            Cancel adding
          </Button>
          <Button type="primary" block size="large" onClick={onOk}>
            Confirm to add
          </Button>
        </div>
      </div>
    </Modal>
  );
};

// const check

export function AddDapp({
  onAddedDapp,
  ...modalProps
}: ModalProps & {
  onAddedDapp?: (origin: string) => void;
}) {
  const [step, setStep] = useState<IStep>('add');
  const navigate = useNavigate();
  const { dapps } = useDapps();

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

  const [dapp, setDapp] = useState<IDapp | null>(null);

  const { dappInfo, setDappInfo, onChangeDappAlias, isValidAlias } =
    useCheckedStep();

  const [duplicatedDapp, setDuplicatedDapp] = useState<IDapp | null>(null);

  const doCheck = useCallback(async () => {
    setCheckError(null);

    const payload = await checkUrl();
    console.log(payload);

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
      setDappInfo(payload.data);
    }
  }, [checkUrl, setCheckError, setDappInfo]);

  const [isShowRelatedModal, setIsShowRelatedModal] = useState(false);
  const [relatedDapps, setRelatedDapps] = useState<IDapp[]>([]);

  const handleAdd = async () => {
    if (!dappInfo) {
      return;
    }

    // eslint-disable-next-line @typescript-eslint/no-shadow
    const relatedDapps = findRelatedDapps(dapps || [], dappInfo.inputOrigin);
    if (relatedDapps.length) {
      setRelatedDapps(relatedDapps);
      setIsShowRelatedModal(true);
      return;
    }

    await addDapp({
      origin: dappInfo.inputOrigin,
      alias: dappInfo.recommendedAlias,
      faviconBase64: dappInfo.faviconBase64,
      faviconUrl: dappInfo.faviconUrl,
    });
  };

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
          // rules={[
          //   {
          //     pattern: /^https:\/\/.+/,
          //     message: 'Dapp with protocols other than HTTPS is not supported',
          //   },
          // ]}
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
                  doCheck();
                }}
                src="rabby-internal://assets/icons/add-dapp/icon-search.svg"
              />
            }
          />
        </Form.Item>
      </Form>
      {dappInfo ? <PreviewDapp data={dappInfo} onAdd={handleAdd} /> : null}
      <RelationModal
        data={relatedDapps}
        open={isShowRelatedModal}
        onCancel={() => {
          setIsShowRelatedModal(false);
        }}
        onOk={() => {
          setIsShowRelatedModal(false);
        }}
      />
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
