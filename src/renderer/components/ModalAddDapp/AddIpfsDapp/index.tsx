import { LoadingOutlined } from '@ant-design/icons';
import { Form, message } from 'antd';
import { ReactNode, useEffect } from 'react';

import {
  addDapp,
  detectDapps,
  downloadIPFS,
  replaceDapp,
} from '@/renderer/ipcRequest/dapps';
import { useOpenDapp } from '@/renderer/utils/react-router';
import { useRequest, useSetState } from 'ahooks';
import classNames from 'classnames';
import { debounce } from 'lodash';
import { canoicalizeDappUrl } from '@/isomorphic/url';
import RabbyInput from '../../AntdOverwrite/Input';
import { Props as ModalProps } from '../../Modal/Modal';
import { toastMessage } from '../../TransparentToast';
import { PreviewDapp } from '../PreviewDapp';
import { useAddDappURL } from '../useAddDapp';
import { Warning } from '../Warning';
import styles from './index.module.less';

const validateInput = (input: string, onReplace?: (v: string) => void) => {
  const domain = input?.trim();
  if (!domain) {
    return {
      validateStatus: 'success' as const,
      help: '',
    };
  }

  const hasProtocol = /^(\w+:)\/\//.test(domain);

  const urlString = hasProtocol ? domain : `https://${domain}`;
  try {
    const url = new URL(urlString);
    const rest = urlString.replace(`${url.protocol}//${url.hostname}`, '');

    // todo detect is domain ?
    if (
      url.hostname.startsWith('.') ||
      url.hostname.endsWith('.') ||
      !url.hostname.includes('.')
    ) {
      return {
        validateStatus: 'error' as const,
        help: 'Input is not a domain',
      };
    }
    // hostname 有转义
    if (/^\w+:\/\//.test(rest)) {
      return {
        validateStatus: 'error' as const,
        help: 'Input is not a domain',
      };
    }
    if (url.hostname === domain) {
      return null;
    }

    return {
      validateStatus: 'error' as const,
      help: (
        <>
          Input should not contain{' '}
          {[
            hasProtocol ? `${url.protocol}//` : null,
            rest.length > 20 ? `${rest.substring(0, 20)}...` : rest,
          ]
            .filter(Boolean)
            .map((v) => `"${v}"`)
            .join(' and ')}
          .
          <br />
          Maybe you want to add{' '}
          <span
            onClick={() => onReplace?.(url.hostname)}
            className={styles.replaceLink}
          >
            {url.hostname}
          </span>{' '}
          ?
        </>
      ),
    };
  } catch (e) {
    return {
      validateStatus: 'error' as const,
      help: 'Input is not a domain',
    };
  }
};

const statsInfo = {
  startTime: Date.now(),
  domain: '',
};

const useCheckDapp = ({ onReplace }: { onReplace?: (v: string) => void }) => {
  const [state, setState] = useSetState<{
    dappInfo?: IDappsDetectResult['data'];
    validateStatus?: 'error' | 'success';
    help?: ReactNode;
  }>({});

  const { runAsync, loading, cancel } = useRequest(
    async (_url: string) => {
      // eslint-disable-next-line no-eval
      // const { cid } = await eval(`import('is-ipfs')`);
      // if (!cid(_url)) {
      //   return {
      //     validateRes: {
      //       validateStatus: 'error' as const,
      //       help: 'Input is not a valid IPFS cid',
      //     },
      //   };
      // }
      const url = _url.replace(/^\/?ipfs\//, '').split('/')[0];
      const { success, error } = await downloadIPFS(`/ipfs/${url}`);
      if (!success) {
        return {
          validateRes: {
            validateStatus: 'error' as const,
            help: error || '',
          },
        };
      }
      return detectDapps(`ipfs://${url}`);
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
          return;
        }

        const { data, error } = res;

        if (error) {
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

  // const handleCheckDebounce = debounce(handleCheck, 700);

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

  return (
    <>
      <Form
        form={form}
        className={classNames(
          styles.form,
          state?.validateStatus !== 'error' && state?.help && styles.formHasHelp
        )}
        onFinish={handleCheck}
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
