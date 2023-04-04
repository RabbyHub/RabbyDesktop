import { useBundleAccount } from './useBundleAccount';

/**
 * - 地址列表
 *  - 返回所有类型的地址：eth btc bn
 *  - 新增地址
 *  - 删除地址
 *  - 修改备注
 * - 返回所有链的余额
 * - 返回所有 token 的余额
 * - 返回所有资产
 *  - eth 的汇总
 *  - bn 的汇总
 */
export const useBundle = () => {
  const bundleAccount = useBundleAccount();

  return {
    ...bundleAccount,
  };
};
