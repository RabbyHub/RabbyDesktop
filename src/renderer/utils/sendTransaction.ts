import {
  ALIAS_ADDRESS,
  CHAINS_ENUM,
  EVENTS,
  INTERNAL_REQUEST_ORIGIN,
} from '@/renderer/utils/constant';
import { intToHex } from '@/renderer/utils/number';
import { walletController, walletOpenapi } from '@/renderer/ipcRequest/rabbyx';

import { findChain } from '@/renderer/utils/chain';
import { GasLevel, Tx, TxPushType } from '@rabby-wallet/rabby-api/dist/types';
import BigNumber from 'bignumber.js';
import {
  parseAction,
  fetchActionRequiredData,
} from '@rabby-wallet/rabby-action';
import eventBus from '@/renderer/utils-shell/eventBus';

import {
  calcGasLimit,
  calcMaxPriorityFee,
  checkGasAndNonce,
  explainGas,
  getNativeTokenBalance,
  getPendingTxs,
} from './transacation';
import {
  makeInternalRequestSession,
  getUIShellWallet,
} from '../hooks-shell/useShellWallet';

// fail code
export const enum FailedCode {
  GasNotEnough = 'GasNotEnough',
  GasTooHigh = 'GasTooHigh',
  SubmitTxFailed = 'SubmitTxFailed',
  DefaultFailed = 'DefaultFailed',
}

type ProgressStatus = 'building' | 'builded' | 'signed' | 'submitted';

/**
 * send transaction without rpcFlow
 * @param tx
 * @param chainServerId
 * @param wallet
 * @param ignoreGasCheck if ignore gas check
 * @param onProgress callback
 * @param gasLevel gas level, default is normal
 * @param lowGasDeadline low gas deadline
 * @param isGasLess is gas less
 * @param isGasAccount is gas account
 */
export const sendTransaction = async ({
  tx,
  chainServerId,
  ignoreGasCheck,
  onProgress,
  gasLevel,
  lowGasDeadline,
  isGasLess,
  isGasAccount,
  waitCompleted = true,
  pushType = 'default',
  ignoreGasNotEnoughCheck,
  shellWallet = getUIShellWallet(),
}: {
  tx: Tx;
  chainServerId: string;
  ignoreGasCheck?: boolean;
  ignoreGasNotEnoughCheck?: boolean;
  onProgress?: (status: ProgressStatus) => void;
  gasLevel?: GasLevel;
  lowGasDeadline?: number;
  isGasLess?: boolean;
  isGasAccount?: boolean;
  waitCompleted?: boolean;
  pushType?: TxPushType;
  /**
   * @description use `useShellWallet` to get shellWallet, to
   */
  shellWallet: ReturnType<typeof getUIShellWallet>;
}) => {
  onProgress?.('building');
  const chain = findChain({
    serverId: chainServerId,
  })!;
  const support1559 = chain.eip['1559'];
  const { address } = (await walletController.getCurrentAccount())!;
  const recommendNonce = await walletController.getRecommendNonce({
    from: tx.from,
    chainId: chain.id,
  });

  // get gas
  let normalGas = gasLevel;
  if (!normalGas) {
    const gasMarket = await walletOpenapi.gasMarket(chainServerId);
    normalGas = gasMarket.find((item) => item.level === 'normal')!;
  }
  const signingTxId = await walletController.addSigningTx(tx);

  // pre exec tx
  const preExecResult = await walletOpenapi.preExecTx({
    tx: {
      ...tx,
      nonce: recommendNonce,
      data: tx.data,
      value: tx.value || '0x0',
      gasPrice: intToHex(Math.round(normalGas.price)),
    },
    origin: INTERNAL_REQUEST_ORIGIN,
    address,
    updateNonce: true,
    pending_tx_list: await getPendingTxs({
      recommendNonce,
      address,
    }),
  });

  const balance = await getNativeTokenBalance({
    chainId: chain.id,
    address,
  });
  let estimateGas = 0;
  if (preExecResult.gas.success) {
    estimateGas = preExecResult.gas.gas_limit || preExecResult.gas.gas_used;
  }
  const {
    gas: gasRaw,
    needRatio,
    gasUsed,
  } = await walletController.getRecommendGas({
    gasUsed: preExecResult.gas.gas_used,
    gas: estimateGas,
    tx,
    chainId: chain.id,
  });
  const gas = new BigNumber(gasRaw);
  let gasLimit = tx.gas || tx.gasLimit;
  let recommendGasLimitRatio = 1;

  if (!gasLimit) {
    const {
      gasLimit: _gasLimit,
      recommendGasLimitRatio: _recommendGasLimitRatio,
    } = await calcGasLimit({
      chain,
      tx,
      gas,
      selectedGas: normalGas,
      nativeTokenBalance: balance,
      explainTx: preExecResult,
      needRatio,
    });
    gasLimit = _gasLimit;
    recommendGasLimitRatio = _recommendGasLimitRatio;
  }

  // calc gasCost
  const gasCost = await explainGas({
    gasUsed,
    gasPrice: normalGas.price,
    chainId: chain.id,
    nativeTokenPrice: preExecResult.native_token.price,
    tx,
    gasLimit,
  });

  // check gas errors
  const checkErrors = ignoreGasNotEnoughCheck
    ? []
    : checkGasAndNonce({
        recommendGasLimit: `0x${gas.toString(16)}`,
        recommendNonce,
        gasLimit: Number(gasLimit),
        nonce: Number(recommendNonce || tx.nonce),
        gasExplainResponse: gasCost,
        isSpeedUp: false,
        isCancel: false,
        tx,
        isGnosisAccount: false,
        nativeTokenBalance: balance,
        recommendGasLimitRatio,
      });

  const isGasNotEnough = !isGasLess && checkErrors.some((e) => e.code === 3001);
  const ETH_GAS_USD_LIMIT = 20;
  const OTHER_CHAIN_GAS_USD_LIMIT = 5;
  let failedCode;
  if (isGasNotEnough) {
    failedCode = FailedCode.GasNotEnough;
  } else if (
    !ignoreGasCheck &&
    // eth gas > $20
    ((chain.enum === CHAINS_ENUM.ETH &&
      gasCost.gasCostUsd.isGreaterThan(ETH_GAS_USD_LIMIT)) ||
      // other chain gas > $5
      (chain.enum !== CHAINS_ENUM.ETH &&
        gasCost.gasCostUsd.isGreaterThan(OTHER_CHAIN_GAS_USD_LIMIT)))
  ) {
    failedCode = FailedCode.GasTooHigh;
  }

  if (failedCode) {
    // eslint-disable-next-line @typescript-eslint/no-throw-literal
    throw {
      name: failedCode,
      gasCost,
    };
  }

  // generate tx with gas
  const transaction: Tx = {
    from: tx.from,
    to: tx.to,
    data: tx.data,
    nonce: recommendNonce,
    value: tx.value,
    chainId: tx.chainId,
    gas: gasLimit,
  };
  const maxPriorityFee = calcMaxPriorityFee(normalGas);
  const maxFeePerGas = intToHex(Math.round(normalGas.price));

  if (support1559) {
    transaction.maxFeePerGas = maxFeePerGas;
    transaction.maxPriorityFeePerGas =
      maxPriorityFee <= 0
        ? tx.maxFeePerGas
        : intToHex(Math.round(maxPriorityFee));
  } else {
    (transaction as Tx).gasPrice = maxFeePerGas;
  }

  // fetch action data
  const actionData = await walletOpenapi.parseTx({
    chainId: chain.serverId,
    tx: {
      ...tx,
      gas: '0x0',
      nonce: recommendNonce || '0x1',
      value: tx.value || '0x0',
      to: tx.to || '',
    },
    origin: origin || '',
    addr: address,
  });
  const parsed = parseAction({
    type: 'transaction',
    data: actionData.action,
    balanceChange: preExecResult.balance_change,
    tx: {
      ...tx,
      gas: '0x0',
      nonce: recommendNonce || '0x1',
      value: tx.value || '0x0',
    },
    preExecVersion: preExecResult.pre_exec_version,
    gasUsed: preExecResult.gas.gas_used,
    sender: tx.from,
  });
  const requiredData = await fetchActionRequiredData({
    type: 'transaction',
    actionData: parsed,
    contractCall: actionData.contract_call,
    chainId: chain.serverId,
    sender: address,
    walletProvider: {
      hasPrivateKeyInWallet: walletController.hasPrivateKeyInWallet,
      hasAddress: walletController.hasAddress,
      getWhitelist: walletController.getWhitelist,
      isWhitelistEnabled: walletController.isWhitelistEnabled,
      getPendingTxsByNonce: walletController.getPendingTxsByNonce,
      findChain,
      ALIAS_ADDRESS,
    },
    tx: {
      ...tx,
      gas: '0x0',
      nonce: recommendNonce || '0x1',
      value: tx.value || '0x0',
    },
    apiProvider: walletOpenapi,
  });

  await walletController.updateSigningTx(signingTxId, {
    rawTx: {
      nonce: recommendNonce,
    },
    explain: {
      ...preExecResult,
    },
    action: {
      actionData: parsed,
      requiredData,
    },
  });
  const logId = actionData.log_id;
  const estimateGasCost = {
    gasCostUsd: gasCost.gasCostUsd,
    gasCostAmount: gasCost.gasCostAmount,
    nativeTokenSymbol: preExecResult.native_token.symbol,
    gasPrice: normalGas.price,
    nativeTokenPrice: preExecResult.native_token.price,
  };

  onProgress?.('builded');

  // submit tx
  let hash = '';
  try {
    if (!shellWallet) {
      console.warn(
        'shellWallet is not ready, we will use walletController instead, but it may cause some APIs which need to be on user-gesture context not work'
      );
    }
    const wcController = shellWallet || walletController;
    hash = await Promise.race([
      wcController.ethSendTransaction({
        data: {
          $ctx: {},
          params: [transaction],
        },
        session: makeInternalRequestSession(),
        approvalRes: {
          ...transaction,
          signingTxId,
          logId,
          lowGasDeadline,
          isGasLess,
          isGasAccount,
          pushType,
        },
        pushed: false,
        result: undefined,
      }),
      // eslint-disable-next-line promise/param-names
      new Promise((_, reject) => {
        eventBus.once(EVENTS.LEDGER.REJECTED, async (data) => {
          if (signingTxId != null) {
            walletController.removeSigningTx(signingTxId);
          }
          reject(new Error(data));
        });
      }),
    ]);
  } catch (e) {
    const err = new Error(e.message);
    err.name = FailedCode.SubmitTxFailed;
    throw err;
  }

  onProgress?.('signed');

  if (waitCompleted) {
    // wait tx completed
    const txCompleted = await new Promise<{ gasUsed: number }>((resolve) => {
      const handler = (res) => {
        if (res?.hash === hash) {
          eventBus.removeEventListener(EVENTS.TX_COMPLETED, handler);
          resolve(res || {});
        }
      };
      eventBus.addEventListener(EVENTS.TX_COMPLETED, handler);
    });

    // calc gas cost
    const gasCostAmount = new BigNumber(txCompleted.gasUsed)
      .times(estimateGasCost.gasPrice)
      .div(1e18);
    const gasCostUsd = new BigNumber(gasCostAmount).times(
      estimateGasCost.nativeTokenPrice
    );

    return {
      txHash: hash,
      gasCost: {
        ...estimateGasCost,
        gasCostUsd,
        gasCostAmount,
      },
    };
  }
  return {
    txHash: hash,
    gasCost: {
      ...estimateGasCost,
    },
  };
};
