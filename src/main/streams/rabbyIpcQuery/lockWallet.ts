import { PasswordStatus } from '@/isomorphic/wallet/lock';
import { rabbyxQuery, RABBY_DESKTOP_KR_PWD } from './_base';

export async function getRabbyxLockInfo() {
  const info: RabbyDesktopLockInfo = {
    pwdStatus: PasswordStatus.Unknown,
  };

  try {
    await rabbyxQuery('walletController.verifyPassword', [
      RABBY_DESKTOP_KR_PWD,
    ]);
    info.pwdStatus = PasswordStatus.UseBuiltIn;
  } catch (e) {
    info.pwdStatus = PasswordStatus.Custom;
  }

  return info;
}

function getInitError(password: string) {
  if (password === RABBY_DESKTOP_KR_PWD) {
    return {
      error: 'Incorret Password',
    };
  }

  return { error: '' };
}

const ERRORS = {
  CURRENT_IS_INCORRET: 'Current password is incorrect',
};

export async function setupWalletPassword(newPassword: string) {
  const result = getInitError(newPassword);
  if (result.error) return result;

  try {
    await rabbyxQuery('walletController.verifyPassword', [
      RABBY_DESKTOP_KR_PWD,
    ]);
    await rabbyxQuery('walletController.updatePassword', [
      RABBY_DESKTOP_KR_PWD,
      newPassword,
    ]);
  } catch (error) {
    result.error = 'Failed to set password';
  }

  return result;
}

export async function updateWalletPassword(
  oldPassword: string,
  newPassword: string
) {
  const result = getInitError(newPassword);
  if (result.error) return result;

  try {
    await rabbyxQuery('walletController.verifyPassword', [oldPassword]);
  } catch (error) {
    result.error = ERRORS.CURRENT_IS_INCORRET;
    return result;
  }

  try {
    await rabbyxQuery('walletController.updatePassword', [
      oldPassword,
      newPassword,
    ]);
  } catch (error) {
    result.error = 'Failed to set password';
  }

  return result;
}

export async function cancelCustomPassword(currentPassword: string) {
  const result = getInitError(currentPassword);
  if (result.error) return result;

  try {
    await rabbyxQuery('walletController.verifyPassword', [currentPassword]);
  } catch (error) {
    result.error = ERRORS.CURRENT_IS_INCORRET;
    return result;
  }

  try {
    await rabbyxQuery('walletController.updatePassword', [
      currentPassword,
      RABBY_DESKTOP_KR_PWD,
    ]);
  } catch (error) {
    result.error = 'Failed to cancel password';
  }

  return result;
}

export async function tryAutoUnlockRabbyX() {
  const isBooted = await rabbyxQuery('walletController.isBooted', []);
  if (!isBooted) {
    await rabbyxQuery('walletController.boot', [RABBY_DESKTOP_KR_PWD]);
  }

  const lockInfo = await getRabbyxLockInfo();

  const useBuiltInPwd = lockInfo.pwdStatus === PasswordStatus.UseBuiltIn;
  try {
    if (useBuiltInPwd) {
      const isUnlocked = await rabbyxQuery('walletController.isUnlocked', []);
      if (!isUnlocked) {
        await rabbyxQuery('walletController.unlock', [RABBY_DESKTOP_KR_PWD]);
      }
    }
  } catch (e) {
    console.error('[tryAutoUnlockRabbyX]');
    console.error(e);
  }

  return {
    useBuiltInPwd,
  };
}
