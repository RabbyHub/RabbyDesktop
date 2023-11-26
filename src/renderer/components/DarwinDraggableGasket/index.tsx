import { useWindowState } from '@/renderer/hooks-shell/useWindowState';
import clsx from 'clsx';

import styles from './index.module.less';

export default function DarwinDraggableGasket({
  className,
  style,
}: React.PropsWithoutRef<{
  className?: string;
  style?: React.CSSProperties;
}>) {
  const { onDarwinToggleMaxmize } = useWindowState();

  return (
    /**
     * In fact, the `-webkit-app-region: drag` set in ::after pseudo will make
     * doubleClick handler not work sometimes
     */
    <div
      className={clsx(styles.darwinDraggableGasket, className)}
      {...(style && { style })}
      onDoubleClickCapture={onDarwinToggleMaxmize}
    />
  );
}
