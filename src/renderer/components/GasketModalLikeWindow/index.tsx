import GlobalMask from '@/renderer/components/MainWindow/GlobalMask';
import { useZPopupViewState } from '@/renderer/hooks/usePopupWinOnMainwin';
import { createGlobalStyle } from 'styled-components';

import styles from './index.module.less';

const MutateAntMaskStyle = createGlobalStyle`
  // special should only used in z-popup view
  .ant-modal-mask {
    background-color: rgba(0, 0, 0, 0.5);
  }
`;

export default function GasketModalLikeWindow() {
  const { svVisible } = useZPopupViewState('gasket-modal-like-window');

  if (!svVisible) return null;

  return (
    <>
      <MutateAntMaskStyle />
      <GlobalMask className={styles.gasket} />
    </>
  );
}
