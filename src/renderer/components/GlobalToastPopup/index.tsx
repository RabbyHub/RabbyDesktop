import { IS_RUNTIME_PRODUCTION } from '@/isomorphic/constants';
import { useClickOutSide } from '@/renderer/hooks/useClick';
import { useBodyClassNameOnMounted } from '@/renderer/hooks/useMountedEffect';
import { usePopupViewInfo } from '@/renderer/hooks/usePopupWinOnMainwin';
import { hideMainwinPopupview } from '@/renderer/ipcRequest/mainwin-popupview';
import { message } from 'antd';
import { useRef } from 'react';

import './index.less';

hideMainwinPopupview('global-toast-popup');

const TOASTKEY = 'global-toast-key';
export default function GlobalToastPopup() {
  useBodyClassNameOnMounted([
    'global-toast-popup',
    !IS_RUNTIME_PRODUCTION ? 'isDebug' : '',
  ]);

  const contentRef = useRef<any>(null);
  const { delayHideView } = usePopupViewInfo('global-toast-popup', {
    onVisibleChanged(payload) {
      if (!payload.visible) {
        return;
      }
      switch (payload.pageInfo.state?.toastType) {
        case 'foo':
          message.destroy(TOASTKEY);
          message.open({
            type: 'error',
            key: TOASTKEY,
            content: <span ref={contentRef}>Nothing but for demo</span>,
            onClose: () => {
              delayHideView(300);
            },
            onClick: () => {
              message.destroy(TOASTKEY);
              delayHideView(300);
            },
            // duration: 0,
          });
          break;
        default:
          break;
      }
    },
  });

  useClickOutSide(contentRef, () => {
    message.destroy(TOASTKEY);
    delayHideView(300);
  });

  return null;
}
