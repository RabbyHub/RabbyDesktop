import { LoadingOutlined } from '@ant-design/icons';
import { Form, message } from 'antd';
import { ReactNode, useEffect } from 'react';

import {
  addDapp,
  cancelDownloadIPFS,
  detectDapps,
  downloadIPFS,
  replaceDapp,
} from '@/renderer/ipcRequest/dapps';
import { useOpenDapp } from '@/renderer/utils/react-router';
import { useRequest, useSetState } from 'ahooks';
import classNames from 'classnames';
import { debounce } from 'lodash';
import { useUnmount } from 'react-use';
import { stats } from '@/isomorphic/stats';
import { walletController } from '@/renderer/ipcRequest/rabbyx';
import { extractIpfsCid } from '@/isomorphic/url';
import { IS_RUNTIME_PRODUCTION } from '@/isomorphic/constants';
import { formatEnsDappOrigin } from '@/isomorphic/dapp';
import RabbyInput from '../../AntdOverwrite/Input';
import { Props as ModalProps } from '../../Modal/Modal';
import { toastMessage } from '../../TransparentToast';
import { PreviewDapp } from '../PreviewDapp';
import { useAddDappURL } from '../useAddDapp';
import { Warning } from '../Warning';
import styles from './index.module.less';
import { DomainExample } from '../DomainExample';

const statsInfo = {
  startTime: Date.now(),
  domain: '',
};
const report = (success: boolean) => {
  const duration = Date.now() - statsInfo.startTime;
  if (statsInfo.domain) {
    stats.report('addDappDuration', {
      duration,
      success,
      domain: statsInfo.domain,
    });
    statsInfo.domain = '';
  }
};

const useCheckDapp = ({ onReplace }: { onReplace?: (v: string) => void }) => {
  const [state, setState] = useSetState<{
    dappInfo?: IDappsDetectResult['data'];
    validateStatus?: 'error' | 'success';
    help?: ReactNode;
  }>({});

  const { runAsync, loading, cancel } = useRequest(
    async (url: string) => {
      if (!url) {
        return {
          validateRes: {
            validateStatus: undefined,
            help: '',
          },
        };
      }
      statsInfo.startTime = Date.now();
      statsInfo.domain = `ens://${url}`;
      if (!url.endsWith('.eth')) {
        return {
          validateRes: {
            validateStatus: 'error' as const,
            help: 'Please enter a valid ENS domain name',
          },
        };
      }
      let contentHash = '';
      try {
        contentHash = await walletController.getEnsContentHash(url);
        if (!contentHash || !/^ipfs:\/\//.test(contentHash)) {
          return {
            validateRes: {
              validateStatus: 'error' as const,
              help: 'We only support access to ENS domain names that resolve to an IPFS-CID',
            },
          };
        }
      } catch (e) {
        return {
          validateRes: {
            validateStatus: 'error' as const,
            help: 'We only support access to ENS domain names that resolve to an IPFS-CID',
          },
        };
      }
      const cid = contentHash.replace(/^ipfs:\/\//, '');
      const { success, error } = await downloadIPFS(`${cid}`);
      if (!success) {
        return {
          validateRes: {
            validateStatus: 'error' as const,
            help: error || '',
          },
        };
      }
      return detectDapps(formatEnsDappOrigin(url, cid));
    },
    {
      manual: true,
      onBefore: () => {
        setState({
          dappInfo: null,
          validateStatus: undefined,
          help: 'Downloading files to local, please wait a moment',
        });
      },
      onError: (e) => {
        setState({
          dappInfo: null,
          validateStatus: undefined,
          help: e.message,
        });
      },
      onSuccess(res) {
        if ('validateRes' in res) {
          if (res.validateRes) {
            setState(res.validateRes);
          }
          report(false);
          return;
        }

        const { data, error } = res;

        if (error) {
          report(false);
          setState({
            validateStatus: 'error',
            help:
              error.type === 'HTTPS_CERT_INVALID' ? (
                <>
                  The https certificate of the Dapp is invalid.
                  <br />
                  [ERROR] {error.message}
                </>
              ) : (
                error.message
              ),
          });
        } else {
          report(true);
          setState({
            dappInfo: data,
            validateStatus: undefined,
            help: null,
          });
        }
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

export function AddEnsDapp({
  onAddedDapp,
  onOpenDapp,
  url: initUrl,
  isGoBack,
  onGoBackClick,
}: ModalProps & {
  onAddedDapp?: (origin: string) => void;
  onOpenDapp?: (origin: string) => void;
  url?: string;
  isGoBack?: boolean;
  onGoBackClick?: (dapp: IDappPartial) => void;
}) {
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

  type TParams = [
    Parameters<typeof addDapp>[0],
    Parameters<typeof replaceDapp>[0]?
  ];
  const { runAsync: runAddDapp, loading: isAddLoading } = useRequest<
    [{ error?: string | null | undefined }, unknown],
    TParams
  >(
    (dapp, ids?) => {
      return Promise.all([
        ids ? replaceDapp(ids, dapp) : addDapp(dapp),
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
  // const zActions = useZPopupLayerOnMain();

  const handleAdd = async (
    dappInfo: NonNullable<IDappsDetectResult['data']>,
    urls?: string[]
  ) => {
    const ensAddr = form.getFieldValue('url');

    await runAddDapp(
      {
        origin: dappInfo.inputOrigin,
        alias: dappInfo.recommendedAlias,
        faviconBase64: dappInfo.faviconBase64,
        faviconUrl: dappInfo.faviconUrl,
        type: 'ens',
        extraInfo: {
          ensAddr,
          ipfsCid: extractIpfsCid(dappInfo.inputOrigin),
          dappAddSource: 'ens-addr',
        },
      },
      urls
    );
    // toastMessage({
    //   type: 'success',
    //   content: 'Add success',
    //   className: styles.toast,
    // });
    const nextState = {
      dappInfo: {
        ...dappInfo,
        isInputExistedDapp: true,
      },
    };
    setState(nextState);

    onAddedDapp?.(dappInfo.inputOrigin);
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

  useUnmount(() => {
    report(false);
    cancelDownloadIPFS();
  });

  return (
    <>
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
            placeholder="Input the ENS"
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
          title="ENS examples:"
          domains={[
            !IS_RUNTIME_PRODUCTION ? '1inch.eth' : '',
            'curve.eth',
          ].filter(Boolean)}
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
            handleAdd(dapp);
          }}
          onOpen={(dapp) => {
            openDapp(dapp.inputOrigin);
            onOpenDapp?.(dapp.inputOrigin);
          }}
          isGoBack={isGoBack}
          onGoBackClick={onGoBackClick}
        />
      ) : null}
    </>
  );
}
