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
import RabbyInput from '../../AntdOverwrite/Input';
import { Props as ModalProps } from '../../Modal/Modal';
import { toastMessage } from '../../TransparentToast';
import { PreviewDapp } from '../PreviewDapp';
import { useAddDappURL } from '../useAddDapp';
import { Warning } from '../Warning';
import styles from './index.module.less';

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
    async (_url: string) => {
      const url = _url
        .replace(/(^\/?ipfs\/)|(^ipfs:\/\/)/, '')
        .replace(/\/$/, '');
      statsInfo.domain = `ipfs://${url}`;
      statsInfo.startTime = Date.now();
      const { success, error } = await downloadIPFS(`${url}`);
      if (!success) {
        return {
          validateRes: {
            validateStatus: 'error' as const,
            help: error || '',
          },
        };
      }
      return detectDapps(`rabby-ipfs://${url}`);
    },
    {
      manual: true,
      onBefore: () => {
        setState({
          dappInfo: null,
          validateStatus: undefined,
          help: 'Downloading files on IPFS to local, please wait a moment...',
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

export function AddIpfsDapp({
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
  onGoBackClick?: (dapp: IDapp) => void;
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

  const { runAsync: runAddDapp, loading: isAddLoading } = useRequest(
    (dapp, ids?: string[]) => {
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

  // const handleCheckDebounce = debounce(handleCheck, 700);
  // const zActions = useZPopupLayerOnMain();

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
        onFieldsChange={() => {
          setState({
            validateStatus: undefined,
            help: '',
          });
        }}
      >
        <Form.Item
          name="url"
          help={
            state?.validateStatus !== 'error' && state?.help ? state?.help : ''
          }
        >
          <RabbyInput
            className={styles.input}
            placeholder="Input the IPFS"
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
