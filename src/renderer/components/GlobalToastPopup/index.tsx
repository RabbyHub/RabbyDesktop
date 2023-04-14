import { IS_RUNTIME_PRODUCTION } from '@/isomorphic/constants';
import { useClickOutSide } from '@/renderer/hooks/useClick';
import { useBodyClassNameOnMounted } from '@/renderer/hooks/useMountedEffect';
import { usePopupViewInfo } from '@/renderer/hooks/usePopupWinOnMainwin';
import { hideMainwinPopupview } from '@/renderer/ipcRequest/mainwin-popupview';
import { message } from 'antd';
import { useRef } from 'react';

import './index.less';
import { toastMessage } from '../TransparentToast';

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
        case 'toast-message': {
          const data = payload.pageInfo.state.data;
          message.destroy(TOASTKEY);
          toastMessage({
            key: TOASTKEY,
            type: data.type,
            content: <span ref={contentRef}>{data.content}</span>,
            duration: data.duration || 3,
            onClose: () => {
              delayHideView(300);
            },
          });
          break;
        }
        default:
          break;
      }
    },
  });

  useClickOutSide(contentRef, () => {
    message.destroy(TOASTKEY);
    delayHideView(300);
  });

  // reset message top position, follow rectTopOffset
  message.config({ top: 0 });

  return null;
}
