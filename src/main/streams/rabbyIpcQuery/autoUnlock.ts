import { rabbyxQuery, RABBY_DESKTOP_KR_PWD } from './_base';

export async function tryAutoUnlockRabbyX() {
  const isBooted = await rabbyxQuery('walletController.isBooted', []);
  if (!isBooted) {
    await rabbyxQuery('walletController.boot', [RABBY_DESKTOP_KR_PWD]);
  }

  let useBuiltInPwd = false;
  try {
    await rabbyxQuery('walletController.verifyPassword', [
      RABBY_DESKTOP_KR_PWD,
    ]);
    useBuiltInPwd = true;
  } catch (e) {
    console.error('[tryAutoUnlockRabbyX]');
    console.error(e);
    useBuiltInPwd = false;
  }

  const isUnlocked = await rabbyxQuery('walletController.isUnlocked', []);
  if (!isUnlocked) {
    await rabbyxQuery('walletController.unlock', [RABBY_DESKTOP_KR_PWD]);
  }

  return {
    useBuiltInPwd,
  };
}
