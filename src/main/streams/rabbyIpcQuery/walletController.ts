import { rabbyxQuery } from './_base';

export async function isBooted() {
  const result = await rabbyxQuery('walletController.isBooted');

  return result;
}
