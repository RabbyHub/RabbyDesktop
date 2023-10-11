import React, { useCallback } from 'react';
import classNames from 'classnames';
import { openExternalUrl } from '@/renderer/ipcRequest/app';

import { IconChevronRight } from '@/../assets/icons/mainwin-settings';

import { SwitchProps, Tooltip } from 'antd';
import { Switch } from '@/renderer/components/Switch/Switch';
import styles from './index.module.less';

type TypedProps = {
  name: React.ReactNode;
  className?: string;
  icon?: string;
  iconBase64?: string;
  disabled?: boolean;
} & (
  | {
      type: 'text';
      text?: string;
    }
  | {
      type: 'action';
      // onClick?: () => void;
      onClick?: React.DOMAttributes<HTMLDivElement>['onClick'];
    }
  | {
      type: 'switch';
      checked: SwitchProps['checked'];
      onChange?: SwitchProps['onChange'];
    }
  | {
      type: 'link';
      link: string;
      useChevron?: boolean;
      openAsDapp?: boolean;
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

export function ItemText({
  children,
  disabled = false,
  ...props
}: React.PropsWithChildren<Omit<TypedProps & { type: 'text' }, 'type'>>) {
  return (
    <div
      className={classNames(
        styles.typedItem,
        disabled && styles.disabled,
        props.className
      )}
    >
      <ItemPartialLeft name={props.name} icon={props.icon} />
      <div className={styles.itemRight}>{props.text || children}</div>
    </div>
  );
}

export function ItemLink({
  children,
  openAsDapp = false,
  ...props
}: React.PropsWithChildren<Omit<TypedProps & { type: 'link' }, 'type'>>) {
  return (
    <div
      className={classNames(styles.typedItem, styles.pointer, props.className)}
      onClick={() => {
        if (!openAsDapp) {
          openExternalUrl(props.link);
        } else {
          // trigger open dapp
          window.rabbyDesktop.ipcRenderer.invoke(
            'safe-open-dapp-tab',
            props.link
          );
        }
      }}
    >
      <ItemPartialLeft name={props.name} icon={props.icon} />
      <div className={styles.itemRight}>
        {children}
        <img src={IconChevronRight} />
      </div>
    </div>
  );
}

export function ItemAction({
  children,
  disabled = false,
  ...props
}: React.PropsWithChildren<Omit<TypedProps & { type: 'action' }, 'type'>>) {
  return (
    <div
      className={classNames(
        styles.typedItem,
        disabled ? styles.disabled : styles.pointer,
        props.className
      )}
      onClick={!disabled ? props.onClick : undefined}
    >
      <ItemPartialLeft name={props.name} icon={props.icon} />
      <div className={styles.itemRight}>{children}</div>
    </div>
  );
}

export function ItemSwitch({
  children,
  ...props
}: React.PropsWithChildren<Omit<TypedProps & { type: 'switch' }, 'type'>>) {
  return (
    <div className={classNames(styles.typedItem, props.className)}>
      <ItemPartialLeft name={props.name} icon={props.icon} />
      <div className={styles.itemRight}>
        <Switch checked={props.checked} onChange={props.onChange} />
      </div>
    </div>
  );
}

export function FooterLink({
  className,
  name,
  iconURL,
  text,
  link,
}: React.PropsWithChildren<{
  className?: string;
  name?: string;
  iconURL?: string;
  text?: string;
  link: string;
}>) {
  return (
    <div
      className={classNames(styles.footerLinkItem, className)}
      onClick={() => {
        openExternalUrl(link);
      }}
    >
      {iconURL ? (
        <Tooltip placement="top" title={name}>
          <img alt={name} src={iconURL} />
        </Tooltip>
      ) : (
        <span className={styles.text}>{text || name}</span>
      )}
    </div>
  );
}

export function ImageAsLink({
  className,
  altName,
  iconURL,
  hoverIconURL,
  link,
  disableTooltip = false,
  tooltipProps,
}: React.PropsWithChildren<{
  className?: string;
  altName?: string;
  iconURL?: string;
  hoverIconURL?: string;
  link: string;
  disableTooltip?: boolean;
  tooltipProps?: React.ComponentProps<typeof Tooltip>;
}>) {
  const onClickImg = useCallback(() => {
    openExternalUrl(link);
  }, [link]);

  return (
    <Tooltip
      placement="top"
      arrowPointAtCenter
      {...tooltipProps}
      {...(disableTooltip && {
        visible: false,
      })}
      title={link}
      className={classNames(hoverIconURL && styles.ImageAsLinkWithHover)}
    >
      <img
        alt={altName}
        src={iconURL}
        className={classNames(styles.imageAsLink, styles.normalIcon, className)}
        onClick={onClickImg}
      />
      {hoverIconURL && (
        <img
          alt={altName}
          src={hoverIconURL}
          className={classNames(
            styles.imageAsLink,
            styles.hoverIcon,
            className
          )}
          onClick={onClickImg}
        />
      )}
    </Tooltip>
  );
}
