import { ReactNode, SyntheticEvent, useEffect, useState } from 'react';
import cx from 'clsx';
import IconCheck from '@/../assets/icons/swap/check.svg';
import styles from './style.module.less';

interface CheckboxProps {
  checked: boolean;
  defaultChecked?: boolean;
  onChange?(checked: boolean): void;
  background?: string;
  unCheckBackground?: string;
  width?: string;
  height?: string;
  className?: string;
  children?: ReactNode;
  checkIcon?: ReactNode;
}

export const Checkbox = ({
  checked,
  onChange,
  defaultChecked = false,
  background = '#8697FF',
  unCheckBackground = '#E5E9EF',

  width = '16px',
  height = '16px',
  className,
  children,
  checkIcon,
}: CheckboxProps) => {
  const [checkState, setCheckState] = useState(defaultChecked);

  useEffect(() => {
    setCheckState(checked);
  }, [checked]);

  const handleValueChange = (e: SyntheticEvent, check: boolean) => {
    e.stopPropagation();
    if (onChange) {
      onChange(check);
    }
  };

  return (
    <div
      className={cx(styles.wrapper, className)}
      onClick={(e) => handleValueChange(e, !checkState)}
    >
      <div
        className={styles.checkbox}
        style={{
          width,
          height,
          backgroundColor: checkState ? background : unCheckBackground,
        }}
      >
        {checkIcon ?? (
          <img
            src={IconCheck}
            className={cx(styles.iconCheck, checkState && styles.checked)}
          />
        )}
      </div>
      {children && <div className={styles.label}>{children}</div>}
    </div>
  );
};

export default Checkbox;
