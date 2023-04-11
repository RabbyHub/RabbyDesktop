import {
  alertCannotUseDueTo,
  getTrezorLikeCannotUse,
} from '../utils/hardwareConnect';
import { handleIpcMainInvoke } from '../utils/ipcMainEvents';

handleIpcMainInvoke('check-trezor-like-cannot-use', (_, key) => {
  const reasons = getTrezorLikeCannotUse(key);

  if (reasons[0]) {
    alertCannotUseDueTo(reasons[0]);
  }

  return {
    reasons,
    couldContinue: reasons.length === 0,
  };
});
