import { isSameAddress } from '@/renderer/utils/address';
import i18n from '@/renderer/utils/i18n';
import {
  ParsedTextActionData,
  ParsedTransactionActionData,
  ParsedTypedDataActionData,
} from '@rabby-wallet/rabby-action';

export const crossCompareOwners = (owners1: string[], owners2: string[]) => {
  return owners1.filter(
    (owner) => !!owners2.find((own) => isSameAddress(own, owner))
  );
};

export const getActionTypeText = (data: ParsedTextActionData | null) => {
  const { t } = i18n;

  if (data?.createKey) {
    return t('page.signTypedData.createKey.title');
  }
  if (data?.verifyAddress) {
    return t('page.signTypedData.verifyAddress.title');
  }
  if (data?.common) {
    return data.common.title;
  }
  return t('page.signTx.unknownAction');
};

export const getTransactionActionTypeText = (
  data: ParsedTransactionActionData
) => {
  const t = i18n.t;

  if (data.swap) {
    return t('page.signTx.swap.title');
  }
  if (data.crossToken) {
    return t('page.signTx.crossChain.title');
  }
  if (data.crossSwapToken) {
    return t('page.signTx.swapAndCross.title');
  }
  if (data.wrapToken) {
    return t('page.signTx.wrapToken');
  }
  if (data.unWrapToken) {
    return t('page.signTx.unwrap');
  }
  if (data.send) {
    return t('page.signTx.send.title');
  }
  if (data.approveToken) {
    return t('page.signTx.tokenApprove.title');
  }
  if (data.revokeToken) {
    return t('page.signTx.revokeTokenApprove.title');
  }
  if (data.sendNFT) {
    return t('page.signTx.sendNFT.title');
  }
  if (data.approveNFT) {
    return t('page.signTx.nftApprove.title');
  }
  if (data.revokeNFT) {
    return t('page.signTx.revokeNFTApprove.title');
  }
  if (data.approveNFTCollection) {
    return t('page.signTx.nftCollectionApprove.title');
  }
  if (data.revokeNFTCollection) {
    return t('page.signTx.revokeNFTCollectionApprove.title');
  }
  if (data.deployContract) {
    return t('page.signTx.deployContract.title');
  }
  if (data.cancelTx) {
    return t('page.signTx.cancelTx.title');
  }
  if (data.pushMultiSig) {
    return t('page.signTx.submitMultisig.title');
  }
  if (data.contractCall) {
    return t('page.signTx.unknownAction');
  }
  if (data.revokePermit2) {
    return t('page.signTx.revokePermit2.title');
  }
  if (data.assetOrder) {
    return t('page.signTx.assetOrder.title');
  }
  if (data?.common) {
    return data.common.title;
  }
  if (data.permit2BatchRevokeToken) {
    return t('page.signTx.batchRevokePermit2.title');
  }
  if (data.transferOwner) {
    return t('page.signTx.transferOwner.title');
  }
  if (data.swapLimitPay) {
    return t('page.signTx.swapLimitPay.title');
  }
  if (data.multiSwap) {
    return t('page.signTx.swap.title');
  }
  return t('page.signTx.unknownAction');
};

export const getActionTypedDataTypeText = (
  data: ParsedTypedDataActionData | null
) => {
  const { t } = i18n;

  if (data?.permit) {
    return t('page.signTypedData.permit.title');
  }
  if (data?.permit2 || data?.batchPermit2) {
    return t('page.signTypedData.permit2.title');
  }
  if (data?.approveNFT) {
    return t('page.signTx.nftApprove.title');
  }
  if (data?.swapTokenOrder) {
    return t('page.signTypedData.swapTokenOrder.title');
  }
  if (data?.buyNFT || data?.sellNFT || data?.batchSellNFT) {
    return t('page.signTypedData.sellNFT.title');
  }
  if (data?.signMultiSig) {
    return t('page.signTypedData.signMultiSig.title');
  }
  if (data?.createKey) {
    return t('page.signTypedData.createKey.title');
  }
  if (data?.verifyAddress) {
    return t('page.signTypedData.verifyAddress.title');
  }
  if (data?.contractCall) {
    return t('page.signTx.unknownAction');
  }
  if (data?.coboSafeCreate) {
    return t('page.signTx.coboSafeCreate.title');
  }
  if (data?.coboSafeModificationRole) {
    return t('page.signTx.coboSafeModificationRole.title');
  }
  if (data?.coboSafeModificationDelegatedAddress) {
    return t('page.signTx.coboSafeModificationDelegatedAddress.title');
  }
  if (data?.coboSafeModificationTokenApproval) {
    return t('page.signTx.coboSafeModificationTokenApproval.title');
  }
  if (data?.send) {
    return t('page.signTx.send.title');
  }
  if (data?.revokePermit) {
    return t('page.signTx.revokePermit.title');
  }
  if (data?.assetOrder) {
    return t('page.signTx.assetOrder.title');
  }
  if (data?.common) {
    return data.common.title;
  }
  if (data && getTransactionActionTypeText(data)) {
    return getTransactionActionTypeText(data);
  }

  return t('page.signTx.unknownAction');
};
