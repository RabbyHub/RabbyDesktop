import { LoadingOutlined } from '@ant-design/icons';
import { Form } from 'antd';
import React, { ReactNode, useEffect } from 'react';

import { canoicalizeDappUrl } from '@/isomorphic/url';
import { addDapp, replaceDapp } from '@/renderer/ipcRequest/dapps';
import { useOpenDapp } from '@/renderer/utils/react-router';
import { useRequest, useSetState } from 'ahooks';
import classNames from 'classnames';
import { useDapps } from 'renderer/hooks/useDappsMngr';
import { debounce } from 'lodash';
import { useGetSpecialDomain } from '@/renderer/hooks-ipc/useAppDynamicConfig';
import RabbyInput from '../AntdOverwrite/Input';
import { Modal, Props as ModalProps } from '../Modal/Modal';
import styles from './index.module.less';
import { PreviewDapp } from './PreviewDapp';
import { RelationModal } from './RelactionModal';
import { useAddDappURL } from './useAddDapp';
import { DomainExample } from './DomainExample';
import { Warning } from './Warning';
import { toastMessage } from '../TransparentToast';

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

const validateInput = (input: string, onReplace?: (v: string) => void) => {
  const domain = input?.trim();
  if (!domain) {
    return {
      validateStatus: 'success' as const,
      help: '',
    };
    // return {
    //   validateStatus: 'error' as const,
    //   help: 'Input the Dapp domain name. e.g. debank.com',
    // };
  }
  const hasSpace = /\s/.test(domain);
  const hasSuffix = /\.\w+/.test(domain);
  if (hasSpace || !hasSuffix || /\.$/.test(domain)) {
    return {
      validateStatus: 'error' as const,
      help: 'Input is not a domain',
    };
  }
  const hasProtocol = /^(\w+:)\/\//.test(domain);
  const hasPath = /\//.test(domain.replace(/^(\w+:)\/\//, ''));

  const urlString = hasProtocol ? domain : `https://${domain}`;
  try {
    const url = new URL(urlString);
    if (url.hostname !== domain.replace(/^(w+:)\/\//, '')) {
      return {
        validateStatus: 'error' as const,
        help: (
          <>
            Input should not contain{' '}
            {[
              hasProtocol ? `${url.protocol}//` : null,
              [
                url.port ? `:${url.port}` : null,
                hasPath ? url.pathname : null,
                url.search ? url.search : null,
              ].join(''),
            ]
              .filter(Boolean)
              .map((v) => `"${v}"`)
              .join(' and ')}{' '}
            .Maybe you want to add{' '}
            <span
              onClick={() => onReplace?.(url.hostname)}
              className={styles.replaceLink}
            >
              {url.hostname}
            </span>
            ?
          </>
        ),
      };
    }
  } catch (e) {
    return {
      validateStatus: 'error' as const,
      help: 'Input is not a domain',
    };
  }
  return null;
};

const useCheckDapp = ({ onReplace }: { onReplace?: (v: string) => void }) => {
  const getSpecialDomain = useGetSpecialDomain();
  const [state, setState] = useSetState<{
    dappInfo?: IDappsDetectResult['data'];
    validateStatus?: 'error' | 'success';
    help?: ReactNode;
  }>({});

  const { detectDapps } = useDapps();
  const { runAsync, loading, cancel } = useRequest(
    async (url: string) => {
      const specialDomain = getSpecialDomain(url);
      if (specialDomain) {
        return {
          validateRes: {
            validateStatus: 'error' as const,
            help: `The domain name of "${specialDomain}" is not supported for now`,
          },
        };
      }
      const validateRes = validateInput(url, onReplace);
      if (validateRes) {
        return {
          validateRes,
        };
      }
      return detectDapps(`https://${url}`);
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
      onSuccess: (res) => {
        if (!res) {
          return;
        }
        if ('validateRes' in res) {
          setState(res.validateRes);
          return;
        }

        const { data, error } = res;

        if (error) {
          setState({
            validateStatus: 'error',
            help: error.message,
          });
          return null;
        }
        if (
          data &&
          data.inputOrigin !== data.finalOrigin &&
          canoicalizeDappUrl(data.inputOrigin).secondaryDomain !==
            canoicalizeDappUrl(data.finalOrigin).secondaryDomain
        ) {
          setState({
            validateStatus: 'error',
            help: (
              <>
                The current domain has been redirected to{' '}
                {data.finalOrigin?.replace(/^\w+:\/\//, '')} which may pose a
                security risk. It cannot be added as a Dapp.
              </>
            ),
          });
          return null;
        }
        const dappUrl = canoicalizeDappUrl(data?.inputOrigin || '');
        if (data && dappUrl.isSubDomain) {
          setState({
            dappInfo: data,
            validateStatus: 'success',
            help: (
              <>
                Check that what you entered may be a subdomain name, whether to
                replace with{' '}
                <span
                  className={styles.replaceLink}
                  onClick={() => {
                    onReplace?.(dappUrl.secondaryDomain);
                  }}
                >
                  {dappUrl.secondaryDomain}
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
    }
  );
  return {
    state,
    setState,
    loading,
    check: runAsync,
    debounceCheck: debounce(runAsync, 500),
    cancel,
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
  url: initUrl,
  openBtn,
}: ModalProps & {
  onAddedDapp?: (origin: string) => void;
  onOpenDapp?: (origin: string) => void;
  url?: string;
  openBtn?: ReactNode;
}) {
  const { dapps } = useDapps();
  const [form] = Form.useForm();
  const openDapp = useOpenDapp();
  const [addUrl] = useAddDappURL();

  const { state, setState, check, loading } = useCheckDapp({
    onReplace(v) {
      form.setFieldsValue({
        url: v,
      });
      check(v);
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
    const { url } = form.getFieldsValue();
    setState({
      validateStatus: undefined,
      help: '',
    });
    await check(url);
  };

  const handleCheckDebounce = debounce(handleCheck, 700);

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
    toastMessage({
      type: 'success',
      content: 'Add success',
      className: styles.toast,
    });
    const nextState = {
      dappInfo: {
        ...dappInfo,
        isInputExistedDapp: true,
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

  const isShowExample = !state?.dappInfo && !state.help && !loading;
  const isShowWarning =
    state.validateStatus === 'error' && state.help && !loading;

  useEffect(() => {
    const url = (initUrl || addUrl || '').replace(/^\w+:\/\//, '');
    form.setFieldsValue({ url });
    if (url) {
      check(url);
    }
  }, [addUrl, check, form, initUrl]);

  return (
    <div className={styles.content}>
      <h3 className={styles.title}>Enter the Dapp domain name</h3>
      <Form
        form={form}
        className={classNames(
          styles.form,
          state?.validateStatus !== 'error' && state?.help && styles.formHasHelp
        )}
        onFinish={handleCheck}
        onFieldsChange={handleCheckDebounce}
      >
        <Form.Item
          name="url"
          help={
            state?.validateStatus !== 'error' && state?.help ? state?.help : ''
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
      {isShowExample && (
        <DomainExample
          onDomainClick={(domain) => {
            form.setFieldsValue({ url: domain });
            handleCheck();
          }}
        />
      )}
      {isShowWarning && <Warning>{state.help}</Warning>}
      {state.dappInfo && !loading ? (
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
          openBtn={openBtn}
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
    url?: string;
    openBtn?: React.ReactNode;
  }
>) {
  return (
    <Modal
      width={1000}
      centered
      {...modalProps}
      onCancel={() => {
        modalProps.onCancel?.();
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
