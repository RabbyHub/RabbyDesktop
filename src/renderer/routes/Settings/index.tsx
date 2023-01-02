import React from 'react';
import classNames from 'classnames';
import { openExternalUrl } from '@/renderer/ipcRequest/app';

import { useAppVersion } from '@/renderer/hooks/useMainBridge';
import styles from './index.module.less';

type TypedProps = {
  name: React.ReactNode;
  className?: string;
  icon?: string;
  iconBase64?: string;
} & (
  | {
      type: 'text';
      text?: string;
    }
  | {
      type: 'link';
      link: string;
      useChevron?: boolean;
    }
  | {
      type: 'switch';
      value: boolean;
      onChange: (value: boolean) => void;
    }
);

function ItemPartialLeft({ name, icon }: Pick<TypedProps, 'name' | 'icon'>) {
  return (
    <div className={styles.itemLeft}>
      {icon && <img className={styles.itemIcon} src={icon} />}
      <div className={styles.itemName}>{name}</div>
    </div>
  );
}

function ItemLink({
  children,
  useChevron = false,
  ...props
}: React.PropsWithChildren<Omit<TypedProps & { type: 'link' }, 'type'>>) {
  return (
    <div
      className={classNames(styles.typedItem, styles.pointer, props.className)}
      onClick={() => {
        openExternalUrl(props.link);
      }}
    >
      <ItemPartialLeft name={props.name} icon={props.icon} />
      <div className={styles.itemRight}>
        <div className={styles.itemArrow}>
          {useChevron ? (
            <img src="rabby-internal://assets/icons/mainwin-settings/chevron-right.svg" />
          ) : (
            <img src="rabby-internal://assets/icons/mainwin-settings/link.svg" />
          )}
        </div>
      </div>
    </div>
  );
}

function ItemText({
  children,
  ...props
}: React.PropsWithChildren<Omit<TypedProps & { type: 'text' }, 'type'>>) {
  return (
    <div className={classNames(styles.typedItem, props.className)}>
      <ItemPartialLeft name={props.name} icon={props.icon} />
      <div className={styles.itemRight}>{props.text || children}</div>
    </div>
  );
}

export function MainWindowSettings() {
  const appVerison = useAppVersion();

  return (
    <div className={styles.settingsPage}>
      {/* Update Area */}
      <div />

      <div className={styles.settingBlock}>
        <h4 className={styles.blockTitle}>About</h4>
        <div className={styles.itemList}>
          <ItemText name="Version" text={appVerison || '-'} />
          {/* <ItemLink name='User Agreement' /> */}
          <ItemLink
            name="Privay Policy"
            link="https://rabby.io/docs/privacy/"
            useChevron
          />
          <ItemLink name="Website" link="https://rabby.io/" />
          <ItemLink name="Discord" link="https://discord.gg/seFBCWmUre" />
          <ItemLink name="Twitter" link="https://twitter.com/Rabby_io" />
        </div>
      </div>
    </div>
  );
}
