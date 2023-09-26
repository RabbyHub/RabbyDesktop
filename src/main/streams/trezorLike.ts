import {
  alertCannotUseDueTo,
  getTrezorLikeCannotUse,
} from '../utils/hardwareConnect';
import { handleIpcMainInvoke } from '../utils/ipcMainEvents';

const { handler: handlerCheckTrezorLikeCannotUser } = handleIpcMainInvoke(
  'check-trezor-like-cannot-use',
  (_, options) => {
    const { openType, alertModal = true } = options || {};
    const reasons = getTrezorLikeCannotUse(openType);

    if (alertModal && reasons[0]) {
      alertCannotUseDueTo({
        ...reasons[0],
        uiData: options?.uiData,
      });
    }

    return {
      reasons,
      couldContinue: reasons.length === 0,
    };
  }
);

handleIpcMainInvoke(
  'rabbyx:check-trezor-like-cannot-use',
  handlerCheckTrezorLikeCannotUser
);

handleIpcMainInvoke('get-trezor-like-availability', (_) => {
  return {
    trezor: { reasons: getTrezorLikeCannotUse('trezor') },
    onekey: { reasons: getTrezorLikeCannotUse('onekey') },
  };
});
