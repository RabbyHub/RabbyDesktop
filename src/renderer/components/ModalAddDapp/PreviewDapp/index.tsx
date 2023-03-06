import { putDapp } from '@/renderer/ipcRequest/dapps';
import { LoadingOutlined } from '@ant-design/icons';
import { Button } from 'antd';
import { useState } from 'react';
import RabbyInput from '../../AntdOverwrite/Input';

import { DappFavicon } from '../../DappFavicon';
import { PreviewWebview } from '../../DappView/PreviewWebview';
import styles from './index.module.less';

interface PreviewDappProps {
  data: NonNullable<IDappsDetectResult['data']>;
  onAdd: (dapp: NonNullable<IDappsDetectResult['data']>) => void;
  onOpen: (dapp: NonNullable<IDappsDetectResult['data']>) => void;
  loading?: boolean;
  openBtn?: React.ReactNode;
}
export const PreviewDapp = ({
  data,
  onAdd,
  loading,
  onOpen,
  openBtn,
}: PreviewDappProps) => {
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
            <RabbyInput
              className={styles.aliasInput}
              value={input}
              autoFocus
              onChange={(e) => {
                const v = e.target.value;
                if (data.isInputExistedDapp) {
                  putDapp({
                    origin: data.inputOrigin,
                    alias: v || '-',
                  });
                }
                setInput(v);
              }}
            />
          </div>
        </div>
        <div className={styles.previewAction}>
          {loading ? (
            <div className={styles.previewLoading}>
              <LoadingOutlined />
            </div>
          ) : (
            <>
              {data?.isInputExistedDapp ? (
                openBtn || (
                  <Button
                    type="primary"
                    className={styles.previewBtnSuccess}
                    onClick={() => {
                      onOpen?.(data);
                    }}
                  >
                    Open
                  </Button>
                )
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
        src={data.inputOrigin}
        loadingView={
          <div className={styles.previewEmpty}>
            <div>
              <img
                className="mb-[12px] w-[32px] h-[32px]"
                src="rabby-internal://assets/icons/add-dapp/icon-pageloading.svg"
                style={{ animation: 'rotate 1s linear infinite' }}
                alt=""
              />
              <div className={styles.previewEmptyTitle}>Loading page...</div>
            </div>
          </div>
        }
        loadFailedView={
          <div className={styles.previewEmpty}>
            <div>
              <img
                src="rabby-internal://assets/icons/add-dapp/icon-failed.svg"
                alt=""
                className="mb-[16px]"
              />
              <div className={styles.previewEmptyTitle}>
                Failed to load the homepage of the current domain
              </div>
            </div>
          </div>
        }
      />
    </div>
  );
};
