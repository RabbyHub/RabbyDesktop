import {
  alertCannotUseDueTo,
  getTrezorLikeCannotUse,
} from '../utils/hardwareConnect';
import { handleIpcMainInvoke } from '../utils/ipcMainEvents';

handleIpcMainInvoke(
  'check-trezor-like-cannot-use',
  (_, key, alertModal = true) => {
    const reasons = getTrezorLikeCannotUse(key);

    if (alertModal && reasons[0]) {
      alertCannotUseDueTo(reasons[0]);
    }

    return {
      reasons,
      couldContinue: reasons.length === 0,
    };
  }
);

handleIpcMainInvoke('get-trezor-like-availability', (_) => {
  return {
    trezor: { reasons: getTrezorLikeCannotUse('trezor') },
    onekey: { reasons: getTrezorLikeCannotUse('onekey') },
  };
});
