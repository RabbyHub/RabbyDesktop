import { message } from 'antd';

import classNames from 'classnames';
import { copyText } from '@/renderer/utils/clipboard';
import styles from './index.module.less';

function copyAttrValue(input: Parameters<typeof copyText>[0]) {
  copyText(input);

  message.open({
    type: 'success',
    content: 'Copied',
  });
}

export default function DeviceAttr({
  icon,
  label,
  value,
  className,
}: React.PropsWithChildren<{
  icon?: React.ReactNode;
  label: string;
  value?: string | number;
  className?: string;
}>) {
  return (
    <span className={classNames(styles.deviceAttr, className)}>
      <span className={styles.attrLabel}>
        {icon || null}
        {label}:
      </span>
      <span
        className={classNames(styles.attrValue, value && styles.copiable)}
        onClick={() => {
          if (!value) return;

          copyAttrValue(value);
        }}
      >
        {value || '-'}
      </span>
    </span>
  );
}
