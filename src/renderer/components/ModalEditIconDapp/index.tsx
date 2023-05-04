import React, { useCallback, useEffect, useState } from 'react';
import classnames from 'classnames';
import { ModalProps, Button } from 'antd';
import { useDapps } from 'renderer/hooks/useDappsMngr';
import { useZPopupViewState } from '@/renderer/hooks/usePopupWinOnMainwin';
import {
  formatDappURLToShow,
  isValidDappAlias,
} from '../../../isomorphic/dapp';

import styles from './index.module.less';
import { DappFavicon } from '../DappFavicon';
import { Modal } from '../Modal/Modal';
import { parseFavIconSize } from '@/isomorphic/html';
import clsx from 'clsx';
import { customizeDappFaviconURL } from '@/renderer/ipcRequest/dapps';

function useEditDappIcon(dapp: IDapp | null) {
  const [isLoading, setIsLoading] = useState(false);

  const [ favicons, setFavicons ] = useState<ISiteMetaData['favicons']>([])

  const fetchMetaData = useCallback(async () => {
    if (!dapp?.origin) return ;

    const result = await window.rabbyDesktop.ipcRenderer.invoke('parse-favicon', dapp?.origin);

    const mapped = (result.metaData?.favicons || []).map(item =>
      ({ ...item, _size: parseFavIconSize(item.sizes) })
    );
    const filtered = mapped.filter(item => !item._size.x || item._size.x >= 32);

    setFavicons(
      (!filtered.length ? mapped : filtered)
        .sort((a, b) => a._size.size < b._size.size ? -1 : 1)
    );
  }, [dapp]);

  useEffect(() => {
    fetchMetaData();
  }, [fetchMetaData]);

  const [ selectedFaviconURL, setSelectedFaviconURL ] = useState<string | null>(dapp?.faviconUrlCustomized || dapp?.faviconUrl || null);
  useEffect(() => {
    setSelectedFaviconURL(dapp?.faviconUrlCustomized || dapp?.faviconUrl || null);
  }, [dapp?.faviconUrl, dapp?.faviconUrlCustomized]);

  console.log('[feat] dapp', dapp);

  return {
    selectedFaviconURL,
    setSelectedFaviconURL,
    favicons,
    isLoading,
  };
}

export default function ModalEditIconDapp({
  dapp,
  onFinished,
  ...modalProps
}: React.PropsWithChildren<
  ModalProps & {
    dapp: IDapp | null;
    onFinished?: () => void;
    onCancel?: () => void;
  }
>) {
  const {
    favicons,
    isLoading,
    selectedFaviconURL,
    setSelectedFaviconURL
  } = useEditDappIcon(dapp);

  const selectedChanged = dapp?.faviconUrlCustomized !== selectedFaviconURL;
  console.log('[feat] selectedFaviconURL', selectedFaviconURL);

  const { dapps } = useDapps({ fetchByDefault: true });

  return (
    <Modal
      width={560}
      centered
      {...modalProps}
      title={null}
      footer={null}
      className={classnames(styles.editIconModal, modalProps.className)}
      wrapClassName={classnames(modalProps.wrapClassName)}
    >
      {dapp ? (
        <div className={styles.editIconDapp}>
          <div className={styles.dappUrl} title={dapp?.origin}>
            {formatDappURLToShow(dapp.id || dapp.origin, { dapps })}
          </div>
          <div className={styles.faviconList}>
            {favicons?.map((icon, index) => {
              const isSelected = selectedFaviconURL && selectedFaviconURL === icon.href;

              return (
                <div
                  className={clsx(styles.dappFavIconWrapper, isSelected && styles.selected)}
                  key={`icon-${icon.href}-${index}`}
                  onClick={() => {
                    if (!isSelected) {
                      setSelectedFaviconURL(icon.href)
                    } else {
                      setSelectedFaviconURL(null)
                    }
                  }}
                >
                  <DappFavicon
                    origin={dapp?.origin}
                    rootClassName={styles.dappFaviconImgRoot}
                    className={styles.dappFavicon}
                    src={icon.href}
                    alt={icon.sizes}
                  />
                  {icon.sizes && <span className={styles.dappFaviconSizes}>
                    {icon.sizes}
                  </span>}
                </div>
              )
            })}
          </div>

          <Button
            loading={isLoading}
            type="primary"
            disabled={!selectedFaviconURL || !selectedChanged}
            className={styles.button}
            onClick={async () => {
              await customizeDappFaviconURL(dapp, selectedFaviconURL || '')
              onFinished?.();
            }}
          >
            Pick
          </Button>
        </div>
      ) : null}
    </Modal>
  );
}

export const RenameDappModal = () => {
  const { svVisible, svState, closeSubview } =
    useZPopupViewState('rename-dapp-modal');

  if (!svState?.dapp) return null;

  return (
    <ModalEditIconDapp
      dapp={svState.dapp}
      open={svVisible}
      onCancel={closeSubview}
      onFinished={closeSubview}
    />
  );
};
