import { useWindowState } from '@/renderer/hooks-shell/useWindowState';
import clsx from 'clsx';

import styles from './index.module.less';

export default function DarwinDraggableGasket({
  className,
}: React.PropsWithoutRef<{
  className?: string;
}>) {
  const { onDarwinToggleMaxmize } = useWindowState();

  return (
    /**
     * In fact, the `-webkit-app-region: drag` set in ::after pseudo will make
     * doubleClick handler not work sometimes
     */
    <div
      className={clsx(styles.darwinDraggableGasket, className)}
      onDoubleClickCapture={onDarwinToggleMaxmize}
    />
  );
}
