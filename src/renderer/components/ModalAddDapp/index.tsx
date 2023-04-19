import React, { useMemo, useState } from 'react';

import classNames from 'classnames';
import clsx from 'clsx';
import { Modal, Props as ModalProps } from '../Modal/Modal';
import { AddDomainDapp } from './AddDomainDapp';
import styles from './index.module.less';
import { AddIpfsDapp } from './AddIpfsDapp';
import { AddEnsDapp } from './AddEnsDapp';
import { AddLocalDapp } from './AddLocalDapp';

export function AddDapp({
  url,
  ...rest
}: ModalProps & {
  onAddedDapp?: (origin: string) => void;
  onOpenDapp?: (origin: string) => void;
  url?: string;
  isGoBack?: boolean;
  onGoBackClick?: (dapp: IDapp) => void;
}) {
  const [innerUrl, setInnerUrl] = useState(url || '');
  const tabs = useMemo(
    () => [
      {
        title: 'Add a Dapp by domain',
        name: 'Domain',
        key: 'domain',
      },
      {
        title: 'Add a Dapp via IPFS',
        name: 'IPFS',
        key: 'ipfs',
      },
      {
        name: 'ENS',
        title: 'Add a Dapp via ENS',
        key: 'ens',
      },
      {
        name: 'Local file',
        title: 'Add Dapp via local file path',
        key: 'file',
      },
    ],
    []
  );

  const [activeTab, setActiveTab] = React.useState(tabs[0].key);

  return (
    <div className={styles.content}>
      <h3 className={styles.title}>Add a new Dapp</h3>
      <div className={styles.tabs}>
        <div className={styles.tabList}>
          {tabs.map((tab) => {
            const isActive = tab.key === activeTab;
            return (
              <div
                className={clsx(
                  styles.tabItem,
                  isActive && styles.tabItemActive
                )}
                onClick={() => {
                  setInnerUrl('');
                  setActiveTab(tab.key);
                }}
                key={tab.key}
              >
                {isActive ? (
                  <>
                    <img
                      src="rabby-internal://assets/icons/add-dapp/icon-tab-border.svg"
                      alt=""
                      className={styles.before}
                    />
                    {tab.title}
                    <img
                      src="rabby-internal://assets/icons/add-dapp/icon-tab-border.svg"
                      alt=""
                      className={styles.after}
                    />
                  </>
                ) : (
                  tab.name
                )}
              </div>
            );
          })}
        </div>
        <div className={styles.tabPanel}>
          {activeTab === 'domain' && <AddDomainDapp url={innerUrl} {...rest} />}
          {activeTab === 'ipfs' && <AddIpfsDapp url={innerUrl} {...rest} />}
          {activeTab === 'ens' && <AddEnsDapp url={innerUrl} {...rest} />}
          {activeTab === 'file' && <AddLocalDapp url={innerUrl} {...rest} />}
        </div>
      </div>
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
    isGoBack?: boolean;
    onGoBackClick?: (dapp: IDapp) => void;
  }
>) {
  return (
    <Modal
      width={896}
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
