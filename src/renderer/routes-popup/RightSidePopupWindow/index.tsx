import clsx from 'clsx';

import { IS_RUNTIME_PRODUCTION } from '@/isomorphic/constants';

import '@/renderer/css/style.less';
import { useBodyClassNameOnMounted } from '@/renderer/hooks/useMountedEffect';
import { useMessageForwarded } from '@/renderer/hooks/useViewsMessage';
import { TxToast } from '@/renderer/components/TxToast';
import styles from './index.module.less';

export default function RightSidePopupWindow() {
  useBodyClassNameOnMounted(
    clsx(['win-right-side-popup', !IS_RUNTIME_PRODUCTION && 'isDebug'])
  );

  useMessageForwarded(
    {
      targetView: 'top-ghost-window',
      type: 'trigger-tooltip',
    },
    (data) => {}
  );

  return (
    <div className={styles.winWrapper}>
      <TxToast />
    </div>
  );
}
