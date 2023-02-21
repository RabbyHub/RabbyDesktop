import { LoadingOutlined } from '@ant-design/icons';
import { Button, Form, ModalProps, InputRef } from 'antd';
import React, { ReactNode, useEffect, useRef, useState } from 'react';

import { canoicalizeDappUrl } from '@/isomorphic/url';
import { addDapp, putDapp, replaceDapp } from '@/renderer/ipcRequest/dapps';
import { useOpenDapp } from '@/renderer/utils/react-router';
import { useMount, useRequest, useSetState } from 'ahooks';
import classNames from 'classnames';
import { useClickAway } from 'react-use';
import { useDapps } from 'renderer/hooks/useDappsMngr';
import { DappFavicon } from '../DappFavicon';
import { Modal } from '../Modal/Modal';
import styles from './index.module.less';
import { useAddDappURL } from './useAddDapp';
import { PreviewWebview } from '../DappView/PreviewWebview';
import RabbyInput from '../AntdOverwrite/Input';

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
interface EditableInputProps {
  value?: string;
  onChange?: (v: string) => void;
  defaultEditable?: boolean;
}
const EditableInput = ({
  value,
  defaultEditable,
  onChange,
}: EditableInputProps) => {
  const [isEdit, setIsEdit] = useState(!!defaultEditable);
  const [form] = Form.useForm();
  const ref = useRef<HTMLDivElement>(null);
  const inputRef = useRef<InputRef>(null);

  useClickAway(
    ref,
    () => {
      setIsEdit(false);
    },
    ['mousedown']
  );

  useMount(() => {
    if (isEdit) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  });

  return (
    <div ref={ref}>
      {isEdit ? (
        <Form
          className={styles.editableInput}
          form={form}
          initialValues={{
            alias: value,
          }}
        >
          <Form.Item name="alias" rules={[{ required: true, message: '' }]}>
            <RabbyInput
              autoFocus
              placeholder="Please input alias"
              maxLength={15}
              ref={inputRef}
            />
          </Form.Item>
          <img
            onClick={() => {
              form.validateFields().then((values) => {
                onChange?.(values.alias);
                setIsEdit(false);
              });
            }}
            src="rabby-internal://assets/icons/add-dapp/icon-check.svg"
            alt=""
          />
        </Form>
      ) : (
        <div className={styles.editableInput}>
          <div className={styles.editableInputStatic}>{value}</div>
          <img
            onClick={() => {
              setIsEdit(true);
              form.setFieldsValue({
                alias: value,
              });
            }}
            src="rabby-internal://assets/icons/add-dapp/icon-edit.svg"
            alt=""
          />
        </div>
      )}
    </div>
  );
};

interface PreviewDappProps {
  data: NonNullable<IDappsDetectResult['data']>;
  onAdd: (dapp: NonNullable<IDappsDetectResult['data']>) => void;
  onOpen: (dapp: NonNullable<IDappsDetectResult['data']>) => void;
  loading?: boolean;
}
const PreviewDapp = ({ data, onAdd, loading, onOpen }: PreviewDappProps) => {
  const [input, setInput] = useState(data.recommendedAlias);

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
            <EditableInput
              value={input}
              defaultEditable={!data?.isExistedDapp}
              onChange={(v) => {
                if (data.isExistedDapp) {
                  putDapp({
                    origin: data.inputOrigin,
                    alias: v,
                  });
                }
                setInput(v);
              }}
            />
          </div>
          <div className={styles.previewDesc}>
            {data.inputOrigin?.replace(/^\w+:\/\//, '')}
          </div>
        </div>
        <div className={styles.previewAction}>
          {loading ? (
            <div className={styles.previewLoading}>
              <LoadingOutlined />
            </div>
          ) : (
            <>
              {data?.isExistedDapp ? (
                <Button
                  type="primary"
                  className={styles.previewBtnSuccess}
                  onClick={() => {
                    onOpen?.(data);
                  }}
                >
                  Open
                </Button>
              ) : (
                <Button
                  type="primary"
                  onClick={() => {
                    if (input) {
                      onAdd({
                        ...data,
                        recommendedAlias: input,
                      });
                    } else {
                      onAdd(data);
                    }
                  }}
                >
                  Add
                </Button>
              )}
            </>
          )}
        </div>
      </div>
      <PreviewWebview
        containerClassName={styles.previewTagContainer}
        src={data.finalOrigin}
        loadFailedView={
          <div className={styles.previewEmpty}>
            <div>
              <img
                src="rabby-internal://assets/icons/add-dapp/icon-failed.svg"
                alt=""
              />
              <div className={styles.previewEmptyTitle}>Page load failed</div>
            </div>
          </div>
        }
      />
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
        <div className={styles.dappOrigin}>
          {dapp?.origin?.replace(/^\w+:\/\//, '')}
        </div>
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
      width={560}
      centered
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

const validateInput = (input: string, onReplace?: (v: string) => void) => {
  const domain = input?.trim();
  if (!domain) {
    return {
      validateStatus: 'error' as const,
      help: 'Input the Dapp domain name. e.g. debank.com',
    };
  }
  const urlString = /^(\w+:)?\/\//.test(domain) ? domain : `https://${domain}`;
  try {
    const url = new URL(urlString);
    if (url.hostname !== domain) {
      return {
        validateStatus: 'error' as const,
        help: (
          <>
            The input is not a domain name. Replace with{' '}
            <span
              className="link"
              onClick={() => {
                onReplace?.(url.hostname);
              }}
            >
              {url.hostname}
            </span>
          </>
        ),
      };
    }
  } catch (e) {
    return {
      validateStatus: 'error' as const,
      help: 'Invalid input',
    };
  }
  return null;
};

const useCheckDapp = ({ onReplace }: { onReplace?: (v: string) => void }) => {
  const [state, setState] = useSetState<{
    dappInfo?: IDappsDetectResult['data'];
    validateStatus?: 'error' | 'success';
    help?: ReactNode;
  }>({});

  const { detectDapps } = useDapps();
  const { runAsync, loading } = useRequest(
    async (url: string) => {
      const validateRes = validateInput(url, onReplace);
      if (validateRes) {
        setState({
          ...validateRes,
        });
        return null;
      }
      const { data, error } = await detectDapps(`https://${url}`);
      if (error) {
        setState({
          validateStatus: 'error',
          help: error.message,
        });
        return null;
      }
      if (data && data.inputOrigin !== data.finalOrigin) {
        setState({
          validateStatus: 'error',
          help: (
            <>
              The current URL is redirected to{' '}
              <span
                className="link"
                onClick={() => {
                  onReplace?.(data.finalOrigin.replace(/^\w+:\/\//, ''));
                }}
              >
                {data.finalOrigin?.replace(/^\w+:\/\//, '')}
              </span>
            </>
          ),
        });
        return null;
      }
      setState({
        dappInfo: data,
        validateStatus: undefined,
        help: null,
      });
      return data;
    },
    {
      manual: true,
      onBefore: () => {
        setState({
          dappInfo: null,
          validateStatus: undefined,
          help: null,
        });
      },
    }
  );
  return {
    state,
    setState,
    loading,
    check: runAsync,
  };
};

const sleep = (time: number) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(null);
    }, time);
  });
};

export function AddDapp({
  onAddedDapp,
  onOpenDapp,
}: ModalProps & {
  onAddedDapp?: (origin: string) => void;
  onOpenDapp?: (origin: string) => void;
}) {
  const { dapps } = useDapps();
  const [form] = Form.useForm();
  const [input, setInput] = useState('');
  const openDapp = useOpenDapp();
  const [addUrl] = useAddDappURL();
  useEffect(() => {
    form.setFieldsValue({ url: addUrl?.replace(/^\w+:\/\//, '') });
  }, [addUrl, form]);

  const { state, setState, check, loading } = useCheckDapp({
    onReplace(v) {
      form.setFieldsValue({
        url: v,
      });
      setState({
        validateStatus: undefined,
        help: '',
      });
    },
  });

  const [addState, setAddState] = useSetState<{
    isShowModal: boolean;
    relatedDapps: IDapp[];
    dappInfo: IDappsDetectResult['data'];
  }>({
    isShowModal: false,
    relatedDapps: [],
    dappInfo: null,
  });

  const { runAsync: runAddDapp, loading: isAddLoading } = useRequest(
    (dapp, urls?: string[]) => {
      return Promise.all([
        urls ? replaceDapp(urls, dapp) : addDapp(dapp),
        sleep(500),
      ]);
    },
    {
      manual: true,
    }
  );

  const handleCheck = async () => {
    if (loading) {
      return;
    }
    const { url } = form.getFieldsValue();
    setState({
      validateStatus: undefined,
      help: '',
    });
    await check(url);
  };

  const handleAdd = async (
    dappInfo: NonNullable<IDappsDetectResult['data']>,
    urls?: string[]
  ) => {
    await runAddDapp(
      {
        origin: dappInfo.inputOrigin,
        alias: dappInfo.recommendedAlias,
        faviconBase64: dappInfo.faviconBase64,
        faviconUrl: dappInfo.faviconUrl,
      },
      urls
    );
    const nextState = {
      dappInfo: {
        ...dappInfo,
        isExistedDapp: true,
      },
    };
    setState(nextState);
    setAddState({
      isShowModal: false,
      relatedDapps: [],
      dappInfo: null,
    });

    onAddedDapp?.(dappInfo.inputOrigin);
  };

  const handleAddCheck = async (
    dappInfo: NonNullable<IDappsDetectResult['data']>
  ) => {
    if (!dappInfo) {
      return;
    }

    const relatedDapps = findRelatedDapps(dapps || [], dappInfo.inputOrigin);
    if (relatedDapps.length) {
      setAddState({
        dappInfo,
        isShowModal: true,
        relatedDapps,
      });
    } else {
      handleAdd(dappInfo);
    }
  };

  return (
    <div className={styles.content}>
      <h3 className={styles.title}>Enter the Dapp domain name</h3>
      <Form
        form={form}
        className={styles.form}
        onFinish={handleCheck}
        onFieldsChange={() => {
          const { url } = form.getFieldsValue();
          setInput(url);
        }}
      >
        <Form.Item
          name="url"
          validateStatus={state?.validateStatus || 'success'}
          help={
            state?.help
              ? state?.help
              : input
              ? null
              : 'To ensure the security of your funds, please ensure that you enter the official domain name of Dapp'
          }
        >
          <RabbyInput
            className={styles.input}
            placeholder="Input the Dapp domain name. e.g. debank.com"
            autoFocus
            spellCheck={false}
            suffix={
              <span className={styles.inputSuffix}>
                {loading ? (
                  <LoadingOutlined />
                ) : (
                  <img
                    onClick={() => {
                      handleCheck();
                    }}
                    src="rabby-internal://assets/icons/add-dapp/icon-search.svg"
                  />
                )}
              </span>
            }
          />
        </Form.Item>
      </Form>
      {state.dappInfo ? (
        <PreviewDapp
          data={state.dappInfo}
          loading={isAddLoading}
          onAdd={(dapp) => {
            handleAddCheck(dapp);
          }}
          onOpen={(dapp) => {
            openDapp(dapp.inputOrigin);
            onOpenDapp?.(dapp.inputOrigin);
          }}
        />
      ) : null}
      <RelationModal
        data={addState.relatedDapps}
        open={addState.isShowModal}
        onCancel={() => {
          setAddState({
            isShowModal: false,
            relatedDapps: [],
            dappInfo: null,
          });
        }}
        onOk={() => {
          if (addState.dappInfo) {
            handleAdd(
              addState.dappInfo,
              addState.relatedDapps.map((d) => d.origin)
            );
          }
        }}
      />
    </div>
  );
}

export default function ModalAddDapp({
  onAddedDapp,
  onOpenDapp,
  ...modalProps
}: React.PropsWithChildren<
  ModalProps & {
    onAddedDapp?: (origin: string) => void;
    onOpenDapp?: (origin: string) => void;
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
      <AddDapp
        onAddedDapp={onAddedDapp}
        onOpenDapp={onOpenDapp}
        {...modalProps}
      />
    </Modal>
  );
}
