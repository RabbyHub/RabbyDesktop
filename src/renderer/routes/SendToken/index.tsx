import IconRcLoading from '@/../assets/icons/swap/loading.svg?rc';
import { UIContactBookItem } from '@/isomorphic/types/contact';
import AccountCard from '@/renderer/components/AccountCard';
import AccountSearchInput from '@/renderer/components/AccountSearchInput';
import AddressViewer from '@/renderer/components/AddressViewer';
import { confirmAddToContactsModalPromise } from '@/renderer/components/Modal/confirms/ConfirmAddToContacts';
import { confirmAddToWhitelistModalPromise } from '@/renderer/components/Modal/confirms/ConfirmAddToWhitelist';
import { TipsWrapper } from '@/renderer/components/TipWrapper';
import { useCurrentAccount } from '@/renderer/hooks/rabbyx/useAccount';
import { useContactsByAddr } from '@/renderer/hooks/rabbyx/useContact';
import { useWhitelist } from '@/renderer/hooks/rabbyx/useWhitelist';
import { useRbiSource } from '@/renderer/hooks/useRbiSource';
import { useRefState } from '@/renderer/hooks/useRefState';
import { forwardMessageTo } from '@/renderer/hooks/useViewsMessage';
import { walletController, walletOpenapi } from '@/renderer/ipcRequest/rabbyx';
import { isSameAddress } from '@/renderer/utils/address';
import { findChain } from '@/renderer/utils/chain';
import { copyText } from '@/renderer/utils/clipboard';
import {
  CAN_ESTIMATE_L1_FEE_CHAINS,
  CAN_NOT_SPECIFY_INTRINSIC_GAS_CHAINS,
  KEYRING_CLASS,
  L2_ENUMS,
  MINIMUM_GAS_LIMIT,
} from '@/renderer/utils/constant';
import {
  formatAmount,
  formatTokenAmount,
  splitNumberByStep,
} from '@/renderer/utils/number';
import { CHAINS_ENUM } from '@debank/common';
import { GasLevel, TokenItem } from '@rabby-wallet/rabby-api/dist/types';
import { Button, Form, Skeleton, message } from 'antd';
import BigNumber from 'bignumber.js';
import clsx from 'clsx';
import { intToHex, isValidAddress, zeroAddress } from 'ethereumjs-util';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAsyncFn, useDebounce } from 'react-use';
import styled from 'styled-components';
import abiCoder, { AbiCoder } from 'web3-eth-abi';
import { useMainWindowModalShownFor } from '@/renderer/components/MainWindow/hooks';
import { GasLevelType } from '@/renderer/components/ReserverGasPopup/ReserverGasModal';
import { SendReserveGasModal } from '@/renderer/components/ReserverGasPopup/SendReserverGasModal';
import { checkIfTokenBalanceEnough } from '@/renderer/utils/token';
import { ChainRender, ChainSelect } from '../Swap/component/ChainSelect';
import { TokenSelect } from '../Swap/component/TokenSelect';
import { ContactEditModal } from './components/ContactEditModal';
import { ContactListModal } from './components/ContactListModal';
import { useOnTxFinished } from './hooks';

const MaxButton = styled.img`
  cursor: pointer;
  user-select: nonce;
  margin-left: 6px;
`;

const SendTokenWrapper = styled.div`
  padding: 24px;
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 8px;
  margin: 0 auto;
  width: 600px;
  color: #fff;
  margin-top: 18px;
  .section {
    background: rgba(0, 0, 0, 0.06);
    border-radius: 8px;
    padding: 24px;
    margin-bottom: 24px;
    .account-card {
      margin-bottom: 20px;
    }
    .section-title {
      font-size: 13px;
      line-height: 16px;
      color: rgba(255, 255, 255, 0.6);
      margin-bottom: 8px;
      display: flex;
      align-items: flex-end;
      .token-balance {
        font-size: 14px;
        line-height: 17px;
        color: #fff;
        display: flex;
        align-items: center;
      }
    }
  }
  .ant-input {
    background: rgba(255, 255, 255, 0.06) !important;
    border: 1px solid rgba(255, 255, 255, 0.4);
    border-radius: 4px;
    color: #fff;
    font-size: 15px;
    line-height: 18px;
    padding: 19px 17px;
    &:focus {
      box-shadow: none;
    }
  }
  .tokenInput {
    height: 72px;
    padding: 0 16px;
    background: rgba(255, 255, 255, 0.06);
    border: 1px solid rgba(255, 255, 255, 0.4);
    border-radius: 4px;
  }
  .ant-form-item:nth-last-child(1) {
    margin-bottom: 0;
  }
  .icon-contact {
    width: 20px;
    height: 20px;
    margin-left: 12px;
    cursor: pointer;
  }
  .contact-info {
    display: flex;
    align-items: center;
    padding: 3px 6px;
    border: 0.5px solid rgba(134, 151, 255, 0.5);
    border-radius: 2px;
    color: #8697ff;
    font-size: 12px;
    line-height: 14px;
    cursor: pointer;
    background-color: transparent;
    transition: background-color 0.3s;
    .icon {
      width: 16px;
      height: 16px;
      margin-right: 4px;
    }
    &:hover {
      background-color: rgba(134, 151, 255, 0.1);
    }
    &.disabled {
      opacity: 0.5;
      cursor: default;
      &:hover {
        background-color: transparent;
      }
    }
  }
  .balance-error {
    font-weight: 400;
    font-size: 13px;
    line-height: 16px;
    text-align: right;
    color: #ff8080;
  }
  .token-info {
    margin-top: 8px;
    border-radius: 4px;
    padding: 25px 16px 16px;
    position: relative;
    z-index: 1;
    background: url('rabby-internal://assets/icons/send-token/contract-bg.svg');
    background-size: cover;
    .section-field {
      display: flex;
      justify-content: space-between;
      font-size: 13px;
      line-height: 16px;
      color: rgba(255, 255, 255, 0.4);
      margin-bottom: 8px;
      .address-viewer-text.normal {
        font-size: 13px;
        line-height: 16px;
        color: rgba(255, 255, 255, 0.4);
        font-weight: normal;
        margin-right: 0;
      }
      .icon-copy {
        width: 14px;
        height: 14px;
        margin-left: 6px;
        cursor: pointer;
        opacity: 0.4;
      }
      &:nth-last-child(1) {
        margin-bottom: 0;
      }
    }
  }

  .sendBtn {
    width: 552px;
    height: 56px;
    border-radius: 8px;
    font-weight: 500;
    font-size: 20px;
    line-height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;

    &:hover {
      box-shadow: 0px 16px 40px rgba(29, 35, 74, 0.2);
    }

    &[disabled] {
      background: #8697ff;
      color: white;
      opacity: 0.6;
      box-shadow: none;
      border-color: transparent;
      cursor: not-allowed;
    }
  }

  .whitelist-alert {
    display: flex;
    font-weight: 400;
    font-size: 13px;
    line-height: 16px;
    color: #ff8080;
    margin-top: 16px;
    margin-bottom: 16px;
    justify-content: center;
    .icon-check {
      width: 14px;
      height: 14px;
      margin-right: 4px;
    }
    &__content {
      max-width: 550px;
      margin-bottom: 0;
    }
    &.granted {
      color: #fff;
    }
  }

  .to-address {
    .ant-input-status-error:not(.ant-input-disabled):not(.ant-input-borderless).ant-input,
    .ant-input-status-error:not(.ant-input-disabled):not(.ant-input-borderless).ant-input:hover {
      border-color: #ff8080;
    }
    .ant-form-item-explain-error {
      padding-top: 8px;
      color: #ff8080;
    }
  }

  .footer {
    padding-top: 24px;
    position: relative;

    &::before {
      position: absolute;
      content: '';
      top: 0;
      left: -24px;
      width: 598px;
      border-top: 1px solid rgba(255, 255, 255, 0.1);
    }
  }
`;

function findInstanceLevel(gasList: GasLevel[]) {
  return gasList.reduce((prev, current) =>
    prev.price >= current.price ? prev : current
  );
}
type FormSendToken = {
  to: string;
  amount: string;
  // messageDataForSendToEoa: string;
  // messageDataForContractCall: string;
};
const SendTokenInner = () => {
  const rbisource = useRbiSource();

  const { currentAccount } = useCurrentAccount();
  const { fetchContactsByAddr, isAddrOnContactBook, getAddressNote } =
    useContactsByAddr();
  const [chain, setChain] = useState(CHAINS_ENUM.ETH);
  const chainItem = useMemo(() => findChain({ enum: chain }), [chain]);

  const [tokenAmountForGas, setTokenAmountForGas] = useState('0');
  const { useForm } = Form;

  const [form] = useForm<{ to: string; amount: string }>();
  const [formSnapshot, setFormSnapshot] = useState(form.getFieldsValue());
  const [contactInfo, setContactInfo] = useState<null | UIContactBookItem>(
    null
  );
  const [currentToken, setCurrentToken] = useState<TokenItem>({
    id: 'eth',
    chain: 'eth',
    name: 'ETH',
    symbol: 'ETH',
    display_symbol: null,
    optimized_symbol: 'ETH',
    decimals: 18,
    logo_url:
      'https://static.debank.com/image/token/logo_url/eth/935ae4e4d1d12d59a99717a24f2540b5.png',
    price: 0,
    is_verified: true,
    is_core: true,
    is_wallet: true,
    time_at: 0,
    amount: 0,
  });

  const [safeInfo, setSafeInfo] = useState<{
    chainId: number;
    nonce: number;
  } | null>(null);
  const [inited, setInited] = useState(false);
  const [sendAlianName, setSendAlianName] = useState<string | null>(null);
  const [showEditContactModal, setShowEditContactModal] = useState(false);
  const [showListContactModal, setShowListContactModal] = useState(false);
  const [editBtnDisabled, setEditBtnDisabled] = useState(true);
  const [cacheAmount, setCacheAmount] = useState('0');
  const [isLoading, setIsLoading] = useState(true);
  const {
    state: isSubmitLoading,
    stateRef: isSubmittingRef,
    setRefState: setIsSubmittingRef,
  } = useRefState(false);
  const [balanceError, setBalanceError] = useState<string | null>(null);
  const [balanceWarn, setBalanceWarn] = useState<string | null>(null);
  const [{ showGasReserved, clickedMax, isEstimatingGas }, setSendMaxInfo] =
    useState({
      /** @deprecated */
      showGasReserved: false,
      clickedMax: false,
      isEstimatingGas: false,
    });
  const setShowGasReserved = useCallback((show: boolean) => {
    setSendMaxInfo((prev) => ({
      ...prev,
      showGasReserved: show,
    }));
  }, []);
  const cancelClickedMax = useCallback(() => {
    setSendMaxInfo((prev) => ({ ...prev, clickedMax: false }));
  }, []);
  const [showContactInfo, setShowContactInfo] = useState(false);
  const [showWhitelistAlert, setShowWhitelistAlert] = useState(false);
  // const [amountFocus, setAmountFocus] = useState(false);

  const [reserveGasOpen, setReserveGasOpen] = useState(false);
  const handleReserveGasClose = useCallback(() => {
    setReserveGasOpen(false);
  }, []);

  const [selectedGasLevel, setSelectedGasLevel] = useState<GasLevel | null>(
    null
  );

  const [estimateGas, setEstimateGas] = useState(0);
  const [temporaryGrant, setTemporaryGrant] = useState(false);
  const [gasPriceMap, setGasPriceMap] = useState<
    Record<string, { list: GasLevel[]; expireAt: number }>
  >({});
  const [isGnosisSafe, setIsGnosisSafe] = useState(false);

  const lastSubmitRef = useRef<{
    token: TokenItem;
    addr: string;
    hash: string;
  } | null>(null);
  const {
    whitelist,
    enable: whitelistEnabled,
    addWhitelist,
    init: initWhiteList,
  } = useWhitelist();
  const [searchParams] = useSearchParams();

  const { toAddressIsValid, toAddressInWhitelist, toAddressInContactBook } =
    useMemo(() => {
      return {
        toAddressIsValid: !!formSnapshot.to && isValidAddress(formSnapshot.to),
        toAddressInWhitelist: !!whitelist.find((item) =>
          isSameAddress(item, formSnapshot.to)
        ),
        toAddressInContactBook: !!isAddrOnContactBook(formSnapshot.to),
      };
    }, [whitelist, isAddrOnContactBook, formSnapshot]);

  const whitelistAlertContent = useMemo(() => {
    if (!whitelistEnabled) {
      return {
        content: 'Whitelist disabled. You can transfer to any address.',
        success: true,
      };
    }
    if (toAddressInWhitelist) {
      return {
        content: 'The address is whitelisted',
        success: true,
      };
    }
    if (temporaryGrant) {
      return {
        content: 'Temporary permission granted',
        success: true,
      };
    }
    return {
      success: false,
      content: (
        <>
          The address is not whitelisted.
          <br /> I agree to grant temporary permission to transfer.
        </>
      ),
    };
  }, [temporaryGrant, toAddressInWhitelist, whitelistEnabled]);

  const canSubmit =
    isValidAddress(form.getFieldValue('to')) &&
    !balanceError &&
    new BigNumber(form.getFieldValue('amount')).gte(0) &&
    !isLoading &&
    (!whitelistEnabled || temporaryGrant || toAddressInWhitelist);
  const isNativeToken =
    currentToken.id === findChain({ enum: chain })?.nativeTokenAddress;

  const fetchGasList = useCallback(
    async (chainEnum?: CHAINS_ENUM) => {
      const chainInfo = findChain({
        enum: chainEnum || chain,
      });
      if (!chainInfo?.serverId) {
        throw new Error('chain not found');
      }
      if (chainInfo.isTestnet) {
        return walletController.getCustomTestnetGasMarket({
          chainId: chainInfo.id,
        });
      }
      return walletOpenapi.gasMarket(chainInfo.serverId);
    },
    [chain]
  );

  const [{ value: gasList }, loadGasList] = useAsyncFn(
    (chainEnum?: CHAINS_ENUM) => {
      return fetchGasList(chainEnum);
    },
    [fetchGasList]
  );

  useEffect(() => {
    loadGasList();
  }, [loadGasList]);
  //   // eslint-disable-next-line react-hooks/exhaustive-deps
  // }, []);

  useDebounce(
    async () => {
      const targetChain = findChain({
        enum: chain,
      });
      if (!targetChain) return;
      let list: GasLevel[];
      if (
        gasPriceMap[targetChain.enum] &&
        gasPriceMap[targetChain.enum].expireAt > Date.now()
      ) {
        list = gasPriceMap[targetChain.enum].list;
      } else {
        list = await fetchGasList();
        setGasPriceMap({
          ...gasPriceMap,
          [targetChain.enum]: {
            list,
            expireAt: Date.now() + 300000, // cache gasList for 5 mins
          },
        });
      }
    },
    500,
    [chain]
  );

  const handleSubmit = async ({
    to,
    amount,
  }: {
    to: string;
    amount: string;
  }) => {
    if (isSubmittingRef.current) return;
    setIsSubmittingRef(true);

    const target = findChain({
      serverId: currentToken.chain,
    })!;
    const sendValue = new BigNumber(amount)
      .multipliedBy(10 ** currentToken.decimals)
      .decimalPlaces(0, BigNumber.ROUND_DOWN);
    const dataInput = [
      {
        name: 'transfer',
        type: 'function',
        inputs: [
          {
            type: 'address',
            name: 'to',
          },
          {
            type: 'uint256',
            name: 'value',
          },
        ] as any[],
      } as const,
      [to, sendValue.toFixed(0)] as any[],
    ] as const;
    const params: Record<string, any> = {
      chainId: target.id,
      from: currentAccount!.address,
      to: currentToken.id,
      value: '0x0',
      data: abiCoder.encodeFunctionCall(dataInput[0], dataInput[1]),
      isSend: true,
    };
    if (safeInfo?.nonce != null) {
      params.nonce = safeInfo.nonce;
    }
    if (isNativeToken) {
      params.to = to;
      delete params.data;

      // if (isShowMessageDataForToken && messageDataForSendToEoa) {
      //   const encodedValue = formatTxInputDataOnERC20(messageDataForSendToEoa)
      //     .hexData;

      //   params.data = encodedValue;
      // } else if (isShowMessageDataForContract && messageDataForContractCall) {
      //   params.data = messageDataForContractCall;
      // }

      params.value = `0x${sendValue.toString(16)}`;
      // L2 has extra validation fee so we can not set gasLimit as 21000 when send native token
      const couldSpecifyIntrinsicGas =
        !CAN_NOT_SPECIFY_INTRINSIC_GAS_CHAINS.includes(target.enum);

      try {
        const code = await walletController.requestETHRpc(
          {
            method: 'eth_getCode',
            params: [to, 'latest'],
          },
          target.serverId
        );
        const notContract = !!code && (code === '0x' || code === '0x0');

        let gasLimit = 0;

        if (estimateGas) {
          gasLimit = estimateGas;
        }

        /**
         * we don't need always fetch estimateGas, if no `params.gas` set below,
         * `params.gas` would be filled on Tx Page.
         */
        if (gasLimit > 0) {
          params.gas = intToHex(gasLimit);
        } else if (notContract && couldSpecifyIntrinsicGas) {
          params.gas = intToHex(21000);
        }
      } catch (e) {
        if (couldSpecifyIntrinsicGas) {
          params.gas = intToHex(21000);
        }
      }

      // if (
      //   isShowMessageDataForToken &&
      //   (messageDataForContractCall || messageDataForSendToEoa)
      // ) {
      //   delete params.gas;
      // }
      setIsSubmittingRef(false);
      if (clickedMax && selectedGasLevel?.price) {
        params.gasPrice = selectedGasLevel?.price;
      }
    }
    try {
      await walletController.setLastTimeSendToken(
        currentAccount!.address,
        currentToken
      );

      const hash = (await walletController.sendRequest({
        method: 'eth_sendTransaction',
        params: [params],
        $ctx: {
          ga: {
            category: 'Send',
            source: 'sendToken',
            trigger: rbisource,
          },
        },
      })) as string;

      form.setFieldsValue({
        ...form.getFieldsValue(),
        amount: '',
      });

      lastSubmitRef.current = {
        hash,
        token: currentToken,
        addr: currentAccount!.address,
      };
    } catch (e: any) {
      message.error(e.message);
    } finally {
      setIsSubmittingRef(false);
    }
  };

  const handleFormValuesChange = useCallback(
    async (
      changedValues: { amount?: string; to?: any } | null,
      { to, amount, ...restForm }: FormSendToken,
      opts?: {
        token?: TokenItem;
        isInitFromCache?: boolean;
      }
    ) => {
      const { token, isInitFromCache } = opts || {};
      if (changedValues && changedValues.to) {
        setTemporaryGrant(false);
      }

      // if ((!isInitFromCache && changedValues?.to) || (!changedValues && to)) {
      //   restForm.messageDataForSendToEoa = '';
      //   restForm.messageDataForContractCall = '';
      // }

      const targetToken = token || currentToken;
      if (!to || !isValidAddress(to)) {
        setEditBtnDisabled(true);
        setShowWhitelistAlert(false);
      } else {
        setShowWhitelistAlert(true);
        setEditBtnDisabled(false);
      }
      let resultAmount = amount;
      if (!/^\d*(\.\d*)?$/.test(amount)) {
        resultAmount = cacheAmount;
      }

      if (amount !== cacheAmount) {
        if (showGasReserved && Number(resultAmount) > 0) {
          setShowGasReserved(false);
        }
      }

      if (
        new BigNumber(resultAmount || 0).isGreaterThan(
          new BigNumber(targetToken.raw_amount_hex_str || 0).div(
            10 ** targetToken.decimals
          )
        )
      ) {
        // Insufficient balance
        setBalanceError('Insufficient balance');
      } else {
        setBalanceError(null);
      }
      const nextFormValues = {
        ...restForm,
        to,
        amount: resultAmount,
      };

      form.setFieldsValue(nextFormValues);
      setFormSnapshot(nextFormValues);
      setCacheAmount(resultAmount);
      const alianName = await walletController.getAlianName(to.toLowerCase());
      if (alianName) {
        setContactInfo({ address: to, name: alianName });
        setShowContactInfo(true);
      } else if (contactInfo) {
        setContactInfo(null);
      }
    },
    [
      cacheAmount,
      contactInfo,
      currentToken,
      form,
      setShowGasReserved,
      showGasReserved,
    ]
  );

  const handleConfirmContact = (account: UIContactBookItem) => {
    setShowListContactModal(false);
    setShowEditContactModal(false);
    setContactInfo(account);
    const values = form.getFieldsValue();
    const to = account ? account.address : '';
    if (!account) return;
    form.setFieldsValue({
      ...values,
      to,
    });
    handleFormValuesChange(null, {
      ...values,
      to,
    });
  };

  const handleCancelEditContact = () => {
    setShowEditContactModal(false);
  };

  const handleListContact = () => {
    setShowListContactModal(true);
  };

  const handleEditContact = () => {
    if (editBtnDisabled) return;
    setShowEditContactModal(true);
  };

  const loadCurrentToken = useCallback(
    async (id: string, chainId: string, address: string, check?: boolean) => {
      // const chain = findChain({
      //   serverId: chainId,
      // });
      const result: TokenItem | null = await walletOpenapi.getToken(
        address,
        chainId,
        id
      );
      /* if (chain?.isTestnet) {
        const res = await walletController.getCustomTestnetToken({
          address,
          chainId: chain.id,
          tokenId: id,
        });
        if (res) {
          result = customTestnetTokenToTokenItem(res);
        }
      } else {
        result = await walletOpenapi.getToken(address, chainId, id);
      } */
      if (result) {
        setCurrentToken(result);
      }
      setIsLoading(false);
      if (result && check) {
        const value = form.getFieldsValue();
        if (value.to && value.amount) {
          if (
            new BigNumber(value.amount || 0).isGreaterThan(
              new BigNumber(result.raw_amount_hex_str || 0).div(
                10 ** result.decimals
              )
            )
          ) {
            setBalanceError('Insufficient balance');
          } else {
            setBalanceError(null);
          }
        }
      }

      return result;
    },
    [form]
  );

  const handleAmountChange = useCallback(() => {
    cancelClickedMax();
  }, [cancelClickedMax]);

  const handleCurrentTokenChange = useCallback(
    async (token: TokenItem) => {
      cancelClickedMax();
      if (showGasReserved) {
        setShowGasReserved(false);
      }
      const account = (await walletController.syncGetCurrentAccount())!;
      const values = form.getFieldsValue();
      if (token.id !== currentToken.id || token.chain !== currentToken.chain) {
        form.setFieldsValue({
          ...values,
          amount: '',
        });
      }
      const foundChain = findChain({ serverId: token.chain });
      setChain(foundChain?.enum ?? CHAINS_ENUM.ETH);
      setCurrentToken(token);
      setEstimateGas(0);
      // await persistPageStateCache({ currentToken: token });
      setBalanceError(null);
      setBalanceWarn(null);
      setIsLoading(true);
      loadCurrentToken(token.id, token.chain, account.address);
    },
    [
      currentToken.chain,
      currentToken.id,
      form,
      loadCurrentToken,
      // persistPageStateCache,
      setShowGasReserved,
      showGasReserved,
      cancelClickedMax,
    ]
  );

  const ethEstimateGas = useCallback(async () => {
    const result = {
      gasNumber: 0,
      gasNumHex: intToHex(0),
    };

    if (!currentAccount?.address) return result;
    if (!chainItem) return result;

    const to = form.getFieldValue('to');

    let _gasUsed: string = intToHex(21000);
    try {
      _gasUsed = await walletController.requestETHRpc(
        {
          method: 'eth_estimateGas',
          params: [
            {
              from: currentAccount.address,
              to: to && isValidAddress(to) ? to : zeroAddress(),
              gasPrice: intToHex(0),
              value: currentToken.raw_amount_hex_str,
            },
          ],
        },
        chainItem.serverId
      );
    } catch (err) {
      console.error(err);
    }
    const gasUsed = chainItem.isTestnet
      ? new BigNumber(_gasUsed).multipliedBy(1.5).integerValue().toNumber()
      : _gasUsed;

    result.gasNumber = Number(gasUsed);
    result.gasNumHex =
      typeof gasUsed === 'string' ? gasUsed : intToHex(gasUsed);

    return result;
  }, [currentAccount, chainItem, form, currentToken.raw_amount_hex_str]);

  const handleGasChange = useCallback(
    (input: {
      gasLevel: GasLevel;
      updateTokenAmount?: boolean;
      gasLimit?: number;
    }) => {
      const {
        gasLevel,
        updateTokenAmount = true,
        gasLimit = MINIMUM_GAS_LIMIT,
      } = input;
      setSelectedGasLevel(gasLevel);

      const gasTokenAmount = new BigNumber(gasLevel.price)
        .times(gasLimit)
        .div(1e18);
      setTokenAmountForGas(gasTokenAmount.toFixed());
      if (updateTokenAmount) {
        const values = form.getFieldsValue();
        const diffValue = new BigNumber(currentToken.raw_amount_hex_str || 0)
          .div(10 ** currentToken.decimals)
          .minus(gasTokenAmount);
        if (diffValue.lt(0)) {
          setShowGasReserved(false);
        }
        const newValues = {
          ...values,
          amount: diffValue.gt(0) ? diffValue.toFixed() : '0',
        };
        form.setFieldsValue(newValues);
      }
      return gasTokenAmount;
    },
    [
      currentToken.decimals,
      currentToken.raw_amount_hex_str,
      form,
      setShowGasReserved,
    ]
  );

  const couldReserveGas = isNativeToken && !isGnosisSafe;

  const handleMaxInfoChanged = useCallback(
    async (input?: { gasLevel: GasLevel }) => {
      if (!currentAccount) return;

      if (isLoading) return;
      if (isEstimatingGas) return;

      const tokenBalance = new BigNumber(
        currentToken.raw_amount_hex_str || 0
      ).div(10 ** currentToken.decimals);
      let amount = tokenBalance.toFixed();
      const to = form.getFieldValue('to');

      const {
        gasLevel = selectedGasLevel ||
          (await loadGasList().then(findInstanceLevel)),
      } = input || {};
      const needReserveGasOnSendToken = gasLevel.price > 0;

      if (couldReserveGas && needReserveGasOnSendToken) {
        setShowGasReserved(true);
        setSendMaxInfo((prev) => ({ ...prev, isEstimatingGas: true }));
        try {
          const { gasNumber } = await ethEstimateGas();
          setEstimateGas(gasNumber);

          let gasTokenAmount = handleGasChange({
            gasLevel,
            updateTokenAmount: false,
            gasLimit: gasNumber,
          });
          if (chainItem && CAN_ESTIMATE_L1_FEE_CHAINS.includes(chain)) {
            const l1GasFee = await walletController.fetchEstimatedL1Fee(
              {
                txParams: {
                  chainId: chainItem.id,
                  from: currentAccount.address,
                  to: to && isValidAddress(to) ? to : zeroAddress(),
                  value: currentToken.raw_amount_hex_str,
                  gas: intToHex(21000),
                  gasPrice: `0x${new BigNumber(gasLevel.price).toString(16)}`,
                  data: '0x',
                },
              },
              chain
            );
            gasTokenAmount = gasTokenAmount
              .plus(new BigNumber(l1GasFee).div(1e18))
              .times(1.1);
          }
          const tokenForSend = tokenBalance.minus(gasTokenAmount);
          amount = tokenForSend.gt(0) ? tokenForSend.toFixed() : '0';
          if (tokenForSend.lt(0)) {
            setShowGasReserved(false);
          }
        } catch (e) {
          if (!isGnosisSafe) {
            // // Gas fee reservation required
            // setBalanceWarn(t('page.sendToken.balanceWarn.gasFeeReservation'));
            setShowGasReserved(false);
          }
        } finally {
          setSendMaxInfo((prev) => ({ ...prev, isEstimatingGas: false }));
        }
      }

      const values = form.getFieldsValue();
      const newValues = {
        ...values,
        amount,
      };
      form.setFieldsValue(newValues);
      handleFormValuesChange(null, newValues);
    },
    [
      chain,
      chainItem,
      currentAccount,
      currentToken.decimals,
      currentToken.raw_amount_hex_str,
      ethEstimateGas,
      selectedGasLevel,
      loadGasList,
      form,
      handleFormValuesChange,
      handleGasChange,
      couldReserveGas,
      isGnosisSafe,
      isLoading,
      setShowGasReserved,
      isEstimatingGas,
    ]
  );
  const handleGasLevelChanged = useCallback(
    async (gl?: GasLevel | null) => {
      handleReserveGasClose();
      const gasLevel: GasLevel =
        gl ||
        (await loadGasList().then(
          (res) =>
            res.find((item) => item.level === 'normal') ||
            findInstanceLevel(res)
        ));

      setSelectedGasLevel(gasLevel);
      handleMaxInfoChanged({ gasLevel });
    },
    [handleReserveGasClose, handleMaxInfoChanged, loadGasList]
  );

  const handleClickMaxButton = useCallback(async () => {
    setSendMaxInfo((prev) => ({ ...prev, clickedMax: true }));

    if (couldReserveGas) {
      setReserveGasOpen(true);
    } else {
      handleMaxInfoChanged();
    }
  }, [couldReserveGas, handleMaxInfoChanged]);

  const handleChainChanged = useCallback(
    async (val: CHAINS_ENUM) => {
      console.log('handleChainChange', val);
      setSendMaxInfo((prev) => ({ ...prev, clickedMax: false }));
      const newGasList = await loadGasList(val);
      console.log(newGasList);
      setSelectedGasLevel(
        newGasList.find(
          (gasLevel) => (gasLevel.level as GasLevelType) === 'normal'
        ) || findInstanceLevel(newGasList)
      );

      const account = (await walletController.syncGetCurrentAccount())!;
      const newChain = findChain({
        enum: val,
      });
      if (!newChain) {
        return;
      }
      setChain(val);
      setCurrentToken({
        id: newChain.nativeTokenAddress,
        decimals: newChain.nativeTokenDecimals,
        logo_url: newChain.nativeTokenLogo,
        symbol: newChain.nativeTokenSymbol,
        display_symbol: newChain.nativeTokenSymbol,
        optimized_symbol: newChain.nativeTokenSymbol,
        is_core: true,
        is_verified: true,
        is_wallet: true,
        amount: 0,
        price: 0,
        name: newChain.nativeTokenSymbol,
        chain: newChain.serverId,
        time_at: 0,
      });
      setEstimateGas(0);

      let nextToken: TokenItem | null = null;
      try {
        nextToken = await loadCurrentToken(
          newChain.nativeTokenAddress,
          newChain.serverId,
          account.address
        );
      } catch (error) {
        console.error(error);
      }

      const values = form.getFieldsValue();
      form.setFieldsValue({
        ...values,
        amount: '',
      });
      setShowGasReserved(false);
      handleFormValuesChange(
        { amount: '' },
        {
          ...values,
          amount: '',
        },
        {
          ...(nextToken && { token: nextToken }),
        }
      );
    },
    [
      form,
      handleFormValuesChange,
      loadCurrentToken,
      setShowGasReserved,
      loadGasList,
    ]
  );

  const handleCopyContractAddress = useCallback((s: string) => {
    copyText(s);
  }, []);

  const initByCache = async () => {
    if (!currentAccount) return;
    const account = currentAccount;
    const qs: Record<string, any> = {};
    const keys = searchParams.keys();
    Array.from(keys).forEach((key) => {
      qs[key] = searchParams.get(key);
    });
    console.log('initByCache');
    if (qs.token) {
      const [tokenChain, id] = qs.token.split(':');
      if (!tokenChain || !id) return;
      const target = findChain({
        serverId: tokenChain,
      });
      if (!target) {
        loadCurrentToken(
          currentToken.id,
          currentToken.chain,
          currentAccount.address
        );
        return;
      }
      setChain(target.enum);
      loadCurrentToken(id, tokenChain, account.address);
    } else {
      const lastTimeToken = await walletController.getLastTimeSendToken(
        account.address
      );
      if (lastTimeToken) setCurrentToken(lastTimeToken);
      const needLoadToken: TokenItem = lastTimeToken || currentToken;
      if (needLoadToken.chain !== findChain({ enum: chain })?.serverId) {
        const target = findChain({
          serverId: needLoadToken.chain,
        });
        if (!target) {
          return;
        }
        setChain(target.enum);
      }
      loadCurrentToken(needLoadToken.id, needLoadToken.chain, account.address);
    }
  };

  const init = async () => {
    const account = currentAccount;
    await initWhiteList();
    if (!account) {
      return;
    }

    if (account.type === KEYRING_CLASS.GNOSIS) {
      setIsGnosisSafe(true);
    }

    setInited(true);
  };

  useEffect(() => {
    if (inited) {
      initByCache();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inited]);

  const getAlianName = async () => {
    const alianName = await walletController.getAlianName(
      currentAccount?.address || ''
    );
    setSendAlianName(alianName || '');
  };

  const handleClickWhitelistAlert = () => {
    if (whitelistEnabled && !temporaryGrant && !toAddressInWhitelist) {
      const toAddr = form.getFieldValue('to');
      confirmAddToWhitelistModalPromise({
        title: 'Grant temporary permission',
        addressToGrant: toAddr,
        onFinished: (ctx) => {
          if (ctx.isAddToWhitelist) {
            addWhitelist(toAddr);
          }
          setTemporaryGrant(true);
        },
      });
    }
  };

  const handleClickAddContact = () => {
    if (toAddressInContactBook) return;

    const toAddr = form.getFieldValue('to');
    confirmAddToContactsModalPromise({
      initAddressNote: getAddressNote(toAddr),
      addrToAdd: toAddr,
      title: 'Add to contacts',
      async onFinished(result) {
        await fetchContactsByAddr();
        // trigger fetch contactInfo
        const values = form.getFieldsValue();
        handleFormValuesChange(null, { ...values });
        forwardMessageTo('*', 'refreshAccountList', {});
        // trigger get balance of address
        // await wallet.getAddressBalance(result.contactAddrAdded, true);
      },
    });
  };

  useEffect(() => {
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (currentAccount) {
      getAlianName();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentAccount]);

  const { balanceNumText } = useMemo(() => {
    const balanceNum = new BigNumber(currentToken.raw_amount_hex_str || 0).div(
      10 ** currentToken.decimals
    );
    const decimalPlaces = clickedMax || selectedGasLevel ? 8 : 4;

    return {
      balanceNumText: formatTokenAmount(
        balanceNum.toFixed(decimalPlaces, BigNumber.ROUND_FLOOR),
        decimalPlaces
      ),
    };
  }, [
    currentToken.raw_amount_hex_str,
    currentToken.decimals,
    clickedMax,
    selectedGasLevel,
  ]);

  useEffect(() => {
    if (currentToken && gasList) {
      const result = checkIfTokenBalanceEnough(currentToken, {
        gasList,
        gasLimit: MINIMUM_GAS_LIMIT,
      });

      if (result.isNormalEnough && result.normalLevel) {
        setSelectedGasLevel(result.normalLevel);
      } else if (result.isSlowEnough && result.slowLevel) {
        setSelectedGasLevel(result.slowLevel);
      } else if (result.customLevel) {
        setSelectedGasLevel(result.customLevel);
      }
    }
  }, [currentToken, gasList]);

  const handleTxFinished: Parameters<typeof useOnTxFinished>[0] = useCallback(
    ({ hash }) => {
      if (
        lastSubmitRef.current?.hash === hash &&
        lastSubmitRef.current?.addr === currentAccount?.address &&
        lastSubmitRef.current?.token === currentToken
      ) {
        loadCurrentToken(
          currentToken?.id,
          currentToken.chain,
          currentAccount?.address,
          true
        );
      }
    },
    [currentAccount?.address, currentToken, loadCurrentToken]
  );

  useOnTxFinished(handleTxFinished);

  useMainWindowModalShownFor('modalInSend', [
    showEditContactModal,
    showListContactModal,
  ]);

  return (
    <SendTokenWrapper>
      <Form
        form={form}
        onFinish={handleSubmit}
        onValuesChange={handleFormValuesChange}
        initialValues={{
          to: '',
          amount: '',
        }}
      >
        <div
          className={clsx('section relative', {
            'mb-40': !showWhitelistAlert,
          })}
        >
          <div className="section-title mb-8">Chain</div>
          <ChainSelect
            className="mb-24"
            value={chain}
            onChange={handleChainChanged}
            chainRender={<ChainRender chain={chain} />}
          />

          <div className="section-title">From</div>
          <AccountCard alianName={sendAlianName} />
          <div className="section-title">
            <span className="section-title__to">To</span>
            <div className="flex flex-1 justify-end items-center">
              {showContactInfo && !!contactInfo && (
                <div
                  className={clsx('contact-info', {
                    disabled: editBtnDisabled,
                  })}
                  onClick={handleEditContact}
                >
                  {contactInfo && (
                    <>
                      <img
                        src="rabby-internal://assets/icons/send-token/icon-edit.svg"
                        className="icon icon-edit"
                      />
                      <span
                        title={contactInfo.name}
                        className="inline-block align-middle truncate max-w-[240px]"
                      >
                        {contactInfo.name}
                      </span>
                    </>
                  )}
                </div>
              )}
              <img
                className="icon icon-contact"
                src={
                  whitelistEnabled
                    ? 'rabby-internal://assets/icons/send-token/whitelist.svg'
                    : 'rabby-internal://assets/icons/send-token/contact.svg'
                }
                onClick={handleListContact}
              />
            </div>
          </div>
          <div className="to-address">
            <Form.Item
              className="mb-0"
              name="to"
              rules={[
                { required: true, message: 'Please input address' },
                {
                  validator(_, value) {
                    if (!value) return Promise.resolve();
                    if (value && isValidAddress(value)) {
                      return Promise.resolve();
                    }
                    return Promise.reject(new Error('This address is invalid'));
                  },
                },
              ]}
            >
              <AccountSearchInput
                placeholder="Enter address or search"
                autoComplete="off"
                autoFocus
                spellCheck={false}
                onSelectedAccount={(account) => {
                  const nextVals = {
                    ...form.getFieldsValue(),
                    to: account.address,
                  };
                  handleFormValuesChange({ to: nextVals.to }, nextVals);
                  form.setFieldsValue(nextVals);
                }}
              />
            </Form.Item>
            {toAddressIsValid && !toAddressInContactBook && (
              <div className="tip-no-contact absolute left-initial top-initial text-r-neutral-body font-normal text-[12px] pt-[12px]">
                Not on address list.{' '}
                <span
                  onClick={handleClickAddContact}
                  className={clsx(
                    'ml-[2px] underline cursor-pointer text-r-blue-default'
                  )}
                >
                  Add to contacts
                </span>
              </div>
            )}
          </div>

          <div className="section-title mt-40 flex justify-between items-center">
            <div className="token-balance whitespace-pre-wrap">
              {isLoading ? (
                <Skeleton.Input active style={{ width: 100 }} />
              ) : (
                <span className="text-[#d3d8e0]">
                  Balance:{' '}
                  <span
                    className="truncate max-w-[80px]"
                    title={balanceNumText}
                  >
                    {balanceNumText}
                  </span>
                </span>
              )}
              {currentToken.amount > 0 && (
                <MaxButton
                  src="rabby-internal://assets/icons/send-token/max-button.svg"
                  onClick={handleClickMaxButton}
                />
              )}
            </div>
            {!clickedMax && (balanceError || balanceWarn) ? (
              <div className="balance-error">{balanceError || balanceWarn}</div>
            ) : null}
          </div>
          <Form.Item name="amount" className="mb-0">
            {currentAccount && (
              <TokenSelect
                className="tokenInput"
                onChange={handleAmountChange}
                onTokenChange={handleCurrentTokenChange}
                chainId={findChain({ enum: chain })?.serverId || null}
                token={currentToken}
                inlinePrize
                hideChainIcon={false}
                logoSize={32}
                // forceFocus={amountFocus}
              />
            )}
          </Form.Item>
          <div className="token-info">
            {!isNativeToken ? (
              <div className="section-field">
                <span>Contract Address</span>
                <span className="flex">
                  <AddressViewer address={currentToken.id} />
                  <TipsWrapper hoverTips="Copy" clickTips="Copied">
                    <img
                      src="rabby-internal://assets/icons/home/copy.svg"
                      className="icon icon-copy"
                      onClick={() => handleCopyContractAddress(currentToken.id)}
                    />
                  </TipsWrapper>
                </span>
              </div>
            ) : (
              ''
            )}
            <div className="section-field">
              <span>Chain</span>
              <span>
                {
                  findChain({
                    serverId: currentToken.chain,
                  })?.name
                }
              </span>
            </div>
            <div className="section-field">
              <span>Price</span>
              <span>
                ${splitNumberByStep((currentToken.price || 0).toFixed(2))}
              </span>
            </div>
          </div>
        </div>
        <div>
          {showWhitelistAlert && (
            <div
              className={clsx(
                'whitelist-alert',
                !whitelistEnabled || whitelistAlertContent.success
                  ? 'granted'
                  : 'cursor-pointer'
              )}
              onClick={handleClickWhitelistAlert}
            >
              <p className="whitelist-alert__content text-center">
                {whitelistEnabled && (
                  <img
                    src={
                      whitelistAlertContent.success
                        ? 'rabby-internal://assets/icons/send-token/icon-check.svg'
                        : temporaryGrant
                        ? 'rabby-internal://assets/icons/send-token/temporary-grant-checkbox.svg'
                        : 'rabby-internal://assets/icons/send-token/icon-uncheck.svg'
                    }
                    className="icon icon-check inline-block relative -top-1"
                  />
                )}
                {whitelistAlertContent.content}
              </p>
            </div>
          )}
          <div className="footer flex justify-center">
            <Button
              disabled={!canSubmit || isSubmitLoading}
              type="primary"
              htmlType="submit"
              size="large"
              className="sendBtn"
              icon={
                isSubmitLoading ? (
                  <IconRcLoading className="animate-spin" />
                ) : null
              }
            >
              Send
            </Button>
          </div>
        </div>
      </Form>
      <ContactEditModal
        open={showEditContactModal}
        address={form.getFieldValue('to')}
        onOk={handleConfirmContact}
        onCancel={handleCancelEditContact}
      />

      <ContactListModal
        visible={showListContactModal}
        onCancel={() => setShowListContactModal(false)}
        onOk={handleConfirmContact}
      />

      <SendReserveGasModal
        selectedItem={selectedGasLevel?.level as GasLevelType}
        chain={chain}
        limit={Math.max(estimateGas, MINIMUM_GAS_LIMIT)}
        onGasChange={(gasLevel) => {
          handleGasLevelChanged(gasLevel);
        }}
        gasList={gasList}
        open={reserveGasOpen}
        rawHexBalance={currentToken.raw_amount_hex_str}
        onCancel={() => handleReserveGasClose()}
      />
    </SendTokenWrapper>
  );
};

const Wrapper = styled.div`
  height: calc(
    var(--mainwin-mainroute-height) - var(--mainwin-headerblock-offset)
  );
  overflow: overlay;
`;

const SendToken = memo(() => {
  const { currentAccount } = useCurrentAccount();
  return (
    <Wrapper>
      <SendTokenInner key={`${currentAccount?.address}`} />
    </Wrapper>
  );
});

export default SendToken;
