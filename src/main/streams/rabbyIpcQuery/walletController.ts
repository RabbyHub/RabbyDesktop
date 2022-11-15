import { rabbyxQuery } from './_base';

export async function isBooted() {
  return rabbyxQuery('walletController.isBooted');
}

export async function isUnlocked() {
  return rabbyxQuery('walletController.isUnlocked');
}
