import BigNumber from 'bignumber.js';
import { ModalConfirm } from '@/renderer/components/Modal/Confirm';
import { ellipsis } from '@/renderer/utils/address';
import { valueGreaterThan10 } from '../../util';
import { ERROR } from '../../error';

export abstract class Cex<Config> {
  static cexName: string;

  protected config!: Config;

  nickname?: string;

  enableInvalidKeyModal = true;

  // 总资产余额
  private totalBalance = new BigNumber(0);

  // 资产余额（排除小于 10u 的资产）
  private balance = new BigNumber(0);

  plusBalance(value: string) {
    if (valueGreaterThan10(value)) {
      this.balance = this.balance.plus(value);
    }
    this.totalBalance = this.totalBalance.plus(value);
  }

  getTotalBalance() {
    return this.totalBalance.toString();
  }

  getBalance() {
    return this.balance.toString();
  }

  resetBalance() {
    this.totalBalance = new BigNumber(0);
    this.balance = new BigNumber(0);
  }

  private visibleInvalidKeyModal = false;

  abstract invoke<T>(method: string, params?: any[]): Promise<T>;

  abstract getAssets(): Promise<any>;

  abstract checkPermission(): Promise<void>;

  abstract getUSDTPrices(): Promise<void>;

  showInvalidKeyModal(remark: string) {
    if (!this.visibleInvalidKeyModal && this.enableInvalidKeyModal) {
      this.visibleInvalidKeyModal = true;
      ModalConfirm({
        title: 'API has become invalid',
        content: `${this.nickname} (${ellipsis(
          remark
        )}) API has become invalid. It will be deleted and removed from Bundle Address.`,
        height: 220,
        okCancel: false,
        okText: 'OK',
      });
    }
    throw new Error(ERROR.INVALID_KEY);
  }
}
