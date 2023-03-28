import { useState, useEffect, useMemo, useCallback, useRef, memo } from 'react';
import clsx from 'clsx';
import BigNumber from 'bignumber.js';
import { useLocation, useSearchParams } from 'react-router-dom';
import { useDebounce } from 'react-use';
import { Form, Skeleton, message, Button } from 'antd';
import abiCoder, { AbiCoder } from 'web3-eth-abi';
import { isValidAddress, intToHex } from 'ethereumjs-util';
import styled from 'styled-components';
import { CHAINS, CHAINS_ENUM } from '@debank/common';
import { useCurrentAccount } from '@/renderer/hooks/rabbyx/useAccount';
import {
  MINIMUM_GAS_LIMIT,
  L2_ENUMS,
  KEYRING_CLASS,
} from '@/renderer/utils/constant';
import { TokenItem, GasLevel } from '@debank/rabby-api/dist/types';
import { UIContactBookItem } from '@/isomorphic/types/contact';
import { useWhitelist } from '@/renderer/hooks/rabbyx/useWhitelist';
import { walletController, walletOpenapi } from '@/renderer/ipcRequest/rabbyx';
import { ChainGas } from '@/isomorphic/types/rabbyx';
import { isSameAddress } from '@/renderer/utils/address';
import { formatAmount, splitNumberByStep } from '@/renderer/utils/number';
import AccountCard from '@/renderer/components/AccountCard';
import AddressViewer from '@/renderer/components/AddressViewer';
import { ModalConfirm } from '@/renderer/components/Modal/Confirm';
import { copyText } from '@/renderer/utils/clipboard';
import { toastCopiedWeb3Addr } from '@/renderer/components/TransparentToast';
import RabbyInput from '@/renderer/components/AntdOverwrite/Input';
import { useRbiSource } from '@/renderer/hooks/useRbiSource';
import GasSelector from './components/GasSelector';
import GasReserved from './components/GasReserved';
import { ChainSelect } from '../Swap/component/ChainSelect';
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
  border: 1px solid rgba(255, 255, 255, 0.2);
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
      max-width: 312px;
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
      border-top: 1px solid rgba(255, 255, 255, 0.2);
    }
  }
`;

const SendTokenInner = () => {
  const rbisource = useRbiSource();

  const { currentAccount } = useCurrentAccount();
  const [chain, setChain] = useState(CHAINS_ENUM.ETH);
  const [tokenAmountForGas, setTokenAmountForGas] = useState('0');
  const { useForm } = Form;
  const { state } = useLocation();
  const { showChainsModal = false } = state ?? {};

  const [form] = useForm<{ to: string; amount: string }>();
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
  const [inited, setInited] = useState(false);
  const [gasList, setGasList] = useState<GasLevel[]>([]);
  const [sendAlianName, setSendAlianName] = useState<string | null>(null);
  const [showEditContactModal, setShowEditContactModal] = useState(false);
  const [showListContactModal, setShowListContactModal] = useState(false);
  const [editBtnDisabled, setEditBtnDisabled] = useState(true);
  const [cacheAmount, setCacheAmount] = useState('0');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitLoading, setIsSubmitLoading] = useState(false);
  const [balanceError, setBalanceError] = useState<string | null>(null);
  const [balanceWarn, setBalanceWarn] = useState<string | null>(null);
  const [showGasReserved, setShowGasReserved] = useState(false);
  const [showContactInfo, setShowContactInfo] = useState(false);
  const [showWhitelistAlert, setShowWhitelistAlert] = useState(false);
  const [amountFocus, setAmountFocus] = useState(false);
  const [gasSelectorVisible, setGasSelectorVisible] = useState(false);
  const [selectedGasLevel, setSelectedGasLevel] = useState<GasLevel | null>(
    null
  );
  const [temporaryGrant, setTemporaryGrant] = useState(false);
  const [toAddressInWhitelist, setToAddressInWhitelist] = useState(false);
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
    init: initWhiteList,
  } = useWhitelist();
  const [searchParams] = useSearchParams();

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
    new BigNumber(form.getFieldValue('amount')).isGreaterThan(0) &&
    !isLoading &&
    (!whitelistEnabled || temporaryGrant || toAddressInWhitelist);
  const isNativeToken = currentToken.id === CHAINS[chain].nativeTokenAddress;

  const fetchGasList = async () => {
    const list: GasLevel[] = await walletOpenapi.gasMarket(
      CHAINS[chain].serverId
    );
    return list;
  };

  useDebounce(
    async () => {
      const targetChain = Object.values(CHAINS).find(
        (item) => item.enum === chain
      );
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

  const calcGasCost = async () => {
    const targetChain = Object.values(CHAINS).find(
      (item) => item.enum === chain
    );
    if (!targetChain) return;
    const list = gasPriceMap[targetChain.enum]?.list;

    if (!list) return new BigNumber(0);

    const lastTimeGas: ChainGas | null =
      await walletController.getLastTimeGasSelection(targetChain.id);
    let gasLevel: GasLevel;
    if (lastTimeGas?.lastTimeSelect === 'gasPrice' && lastTimeGas.gasPrice) {
      // use cached gasPrice if exist
      gasLevel = {
        level: 'custom',
        price: lastTimeGas.gasPrice,
        front_tx_count: 0,
        estimated_seconds: 0,
        base_fee: 0,
      };
    } else if (
      lastTimeGas?.lastTimeSelect &&
      lastTimeGas?.lastTimeSelect === 'gasLevel'
    ) {
      const target = gasList.find(
        (item) => item.level === lastTimeGas?.gasLevel
      )!;
      gasLevel = target;
    } else {
      // no cache, use the fast level in gasMarket
      gasLevel = gasList.find((item) => item.level === 'fast')!;
    }
    const costTokenAmount = new BigNumber(gasLevel.price)
      .times(21000)
      .div(1e18);
    return costTokenAmount;
  };

  const handleSubmit = async ({
    to,
    amount,
  }: {
    to: string;
    amount: string;
  }) => {
    setIsSubmitLoading(true);
    const target = Object.values(CHAINS).find(
      (item) => item.serverId === currentToken.chain
    )!;
    const sendValue = new BigNumber(amount).multipliedBy(
      10 ** currentToken.decimals
    );
    const params: Record<string, any> = {
      chainId: target.id,
      from: currentAccount!.address,
      to: currentToken.id,
      value: '0x0',
      data: (abiCoder as unknown as AbiCoder).encodeFunctionCall(
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
          ],
        },
        [to, sendValue.toFixed(0)]
      ),
      isSend: true,
    };
    if (isNativeToken) {
      params.to = to;
      delete params.data;
      params.value = `0x${sendValue.toString(16)}`;
      try {
        const code = await walletController.requestETHRpc(
          {
            method: 'eth_getCode',
            params: [to, 'latest'],
          },
          target.serverId
        );
        if (
          code &&
          (code === '0x' || code === '0x0') &&
          !L2_ENUMS.includes(target.enum)
        ) {
          params.gas = intToHex(21000); // L2 has extra validation fee so can not set gasLimit as 21000 when send native token
        }
      } catch (e) {
        if (!L2_ENUMS.includes(target.enum)) {
          params.gas = intToHex(21000); // L2 has extra validation fee so can not set gasLimit as 21000 when send native token
        }
      }
      if (showGasReserved) {
        params.gasPrice = selectedGasLevel?.price;
      }
    }
    try {
      setAmountFocus(false);

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
      lastSubmitRef.current = {
        hash,
        token: currentToken,
        addr: currentAccount!.address,
      };
    } catch (e: any) {
      message.error(e.message);
    } finally {
      setIsSubmitLoading(false);
      setAmountFocus(true);
    }
  };

  const handleFormValuesChange = async (
    changedValues: { amount?: string; to?: any } | null,
    {
      to,
      amount,
    }: {
      to: string;
      amount: string;
    },
    token?: TokenItem
  ) => {
    if (changedValues && changedValues.to) {
      setTemporaryGrant(false);
    }
    const targetToken = token || currentToken;
    if (!to || !isValidAddress(to)) {
      setEditBtnDisabled(true);
      setShowWhitelistAlert(false);
    } else {
      setShowWhitelistAlert(true);
      setEditBtnDisabled(false);
      setToAddressInWhitelist(
        !!whitelist.find((item) => isSameAddress(item, to))
      );
    }
    let resultAmount = amount;
    if (!/^\d*(\.\d*)?$/.test(amount)) {
      resultAmount = cacheAmount;
    }

    if (amount !== cacheAmount) {
      if (showGasReserved && Number(resultAmount) > 0) {
        setShowGasReserved(false);
      } else if (isNativeToken && !isGnosisSafe) {
        // const gasCostTokenAmount = await calcGasCost();
        // if (
        //   new BigNumber(targetToken.raw_amount_hex_str || 0)
        //     .div(10 ** targetToken.decimals)
        //     .minus(amount)
        //     .minus(gasCostTokenAmount || 0)
        //     .lt(0)
        // ) {
        //   setBalanceWarn('Gas fee reservation required');
        // } else {
        //   setBalanceWarn(null);
        // }
      }
    }

    if (
      new BigNumber(resultAmount || 0).isGreaterThan(
        new BigNumber(targetToken.raw_amount_hex_str || 0).div(
          10 ** targetToken.decimals
        )
      )
    ) {
      setBalanceError('Insufficient balance');
    } else {
      setBalanceError(null);
    }
    form.setFieldsValue({
      to,
      amount: resultAmount,
    });
    setCacheAmount(resultAmount);
    const alianName = await walletController.getAlianName(to.toLowerCase());
    console.log(alianName);
    if (alianName) {
      setContactInfo({ address: to, name: alianName });
      setShowContactInfo(true);
    } else if (contactInfo) {
      setContactInfo(null);
    }
  };

  const handleConfirmContact = (account: UIContactBookItem) => {
    setShowListContactModal(false);
    setShowEditContactModal(false);
    setContactInfo(account);
    setAmountFocus(true);
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
      const t = await walletOpenapi.getToken(address, chainId, id);
      setCurrentToken(t);
      setIsLoading(false);

      if (check) {
        const valuse = form.getFieldsValue();
        if (valuse.to && valuse.amount) {
          if (
            new BigNumber(valuse.amount || 0).isGreaterThan(
              new BigNumber(t.raw_amount_hex_str || 0).div(10 ** t.decimals)
            )
          ) {
            setBalanceError('Insufficient balance');
          } else {
            setBalanceError(null);
          }
        }
      }
    },
    [form]
  );

  const handleCurrentTokenChange = async (token: TokenItem) => {
    if (!currentAccount) return;
    if (showGasReserved) {
      setShowGasReserved(false);
    }
    const values = form.getFieldsValue();
    if (token.id !== currentToken.id || token.chain !== currentToken.chain) {
      form.setFieldsValue({
        ...values,
        amount: '',
      });
    }
    setCurrentToken(token);
    setBalanceError(null);
    setBalanceWarn(null);
    setIsLoading(true);
    loadCurrentToken(token.id, token.chain, currentAccount.address);
  };

  const handleGasChange = (gas: GasLevel, updateTokenAmount = true) => {
    setSelectedGasLevel(gas);
    const gasTokenAmount = new BigNumber(gas.price)
      .times(MINIMUM_GAS_LIMIT)
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
  };

  const handleClickTokenBalance = async () => {
    if (isLoading) return;
    if (showGasReserved) return;
    const tokenBalance = new BigNumber(
      currentToken.raw_amount_hex_str || 0
    ).div(10 ** currentToken.decimals);
    let amount = tokenBalance.toFixed();

    if (isNativeToken && !isGnosisSafe) {
      setShowGasReserved(true);
      try {
        const list = await fetchGasList();
        setGasList(list);
        let instant = list[0];
        for (let i = 1; i < list.length; i++) {
          if (list[i].price > instant.price) {
            instant = list[i];
          }
        }
        const gasTokenAmount = handleGasChange(instant, false);
        const tokenForSend = tokenBalance.minus(gasTokenAmount);
        amount = tokenForSend.gt(0) ? tokenForSend.toFixed() : '0';
        if (tokenForSend.lt(0)) {
          setShowGasReserved(false);
        }
      } catch (e) {
        if (!isGnosisSafe) {
          setBalanceWarn('Gas fee reservation required');
          setShowGasReserved(false);
        }
      }
    }

    const values = form.getFieldsValue();
    const newValues = {
      ...values,
      amount,
    };
    form.setFieldsValue(newValues);
    handleFormValuesChange(null, newValues);
  };

  const handleChainChanged = async (val: CHAINS_ENUM) => {
    if (!currentAccount) return;
    const selectChain = CHAINS[val];
    setChain(val);
    setCurrentToken({
      id: selectChain.nativeTokenAddress,
      decimals: selectChain.nativeTokenDecimals,
      logo_url: selectChain.nativeTokenLogo,
      symbol: selectChain.nativeTokenSymbol,
      display_symbol: selectChain.nativeTokenSymbol,
      optimized_symbol: selectChain.nativeTokenSymbol,
      is_core: true,
      is_verified: true,
      is_wallet: true,
      amount: 0,
      price: 0,
      name: selectChain.nativeTokenSymbol,
      chain: selectChain.serverId,
      time_at: 0,
    });
    loadCurrentToken(
      selectChain.nativeTokenAddress,
      selectChain.serverId,
      currentAccount.address
    );
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
      }
    );
  };

  const handleCopyContractAddress = useCallback((s: string) => {
    copyText(s);
    toastCopiedWeb3Addr(s);
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
      const target = Object.values(CHAINS).find(
        (item) => item.serverId === tokenChain
      );
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
      if (needLoadToken.chain !== CHAINS[chain].serverId) {
        const target = Object.values(CHAINS).find(
          (item) => item.serverId === needLoadToken.chain
        )!;
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

  const handleClickGasReserved = () => {
    setGasSelectorVisible(true);
  };

  const handleGasSelectorClose = () => {
    setGasSelectorVisible(false);
  };

  const handleClickWhitelistAlert = () => {
    if (whitelistEnabled && !temporaryGrant && !toAddressInWhitelist) {
      ModalConfirm({
        title: 'Grant temporary permission',
        height: 268,
        onOk: () => {
          setTemporaryGrant(true);
        },
      });
    }
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
        <ChainSelect value={chain} onChange={handleChainChanged} />

        <div className="section relative mt-16">
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
              name="to"
              rules={[
                { required: true, message: 'Please input address' },
                {
                  validator(_, value) {
                    if (!value) return Promise.resolve();
                    if (value && isValidAddress(value)) {
                      setAmountFocus(true);
                      return Promise.resolve();
                    }
                    return Promise.reject(new Error('This address is invalid'));
                  },
                },
              ]}
            >
              <RabbyInput
                placeholder="Enter the address"
                autoComplete="off"
                autoFocus
                spellCheck={false}
                size="large"
              />
            </Form.Item>
          </div>
        </div>
        <div
          className={clsx('section', {
            'mb-40': !showWhitelistAlert,
          })}
        >
          <div className="section-title flex justify-between items-center">
            <div className="token-balance whitespace-pre-wrap">
              {isLoading ? (
                <Skeleton.Input active style={{ width: 100 }} />
              ) : (
                <>
                  Balance:{' '}
                  <span
                    className="truncate max-w-[80px]"
                    title={formatAmount(
                      new BigNumber(currentToken.raw_amount_hex_str || 0)
                        .div(10 ** currentToken.decimals)
                        .toFixed(),
                      4
                    )}
                  >
                    {formatAmount(
                      new BigNumber(currentToken.raw_amount_hex_str || 0)
                        .div(10 ** currentToken.decimals)
                        .toFixed(),
                      4
                    )}
                  </span>
                </>
              )}
              {currentToken.amount > 0 && (
                <MaxButton
                  src="rabby-internal://assets/icons/send-token/max-button.svg"
                  onClick={handleClickTokenBalance}
                />
              )}
            </div>
            {showGasReserved &&
              (selectedGasLevel ? (
                <GasReserved
                  token={currentToken}
                  amount={tokenAmountForGas}
                  onClickAmount={handleClickGasReserved}
                />
              ) : (
                <Skeleton.Input active style={{ width: 180 }} />
              ))}
            {!showGasReserved && (balanceError || balanceWarn) ? (
              <div className="balance-error">{balanceError || balanceWarn}</div>
            ) : null}
          </div>
          <Form.Item name="amount" className="mb-0">
            {currentAccount && (
              <TokenSelect
                className="tokenInput"
                onTokenChange={handleCurrentTokenChange}
                chainId={CHAINS[chain].serverId}
                token={currentToken}
                inlinePrize
                hideChainIcon={false}
                logoSize={32}
                forceFocus={amountFocus}
              />
            )}
          </Form.Item>
          <div className="token-info">
            {!isNativeToken ? (
              <div className="section-field">
                <span>Contract Address</span>
                <span className="flex">
                  <AddressViewer address={currentToken.id} />
                  <img
                    src="rabby-internal://assets/icons/home/copy.svg"
                    className="icon icon-copy"
                    onClick={() => handleCopyContractAddress(currentToken.id)}
                  />
                </span>
              </div>
            ) : (
              ''
            )}
            <div className="section-field">
              <span>Chain</span>
              <span>
                {
                  Object.values(CHAINS).find(
                    (item) => item.serverId === currentToken.chain
                  )?.name
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
              disabled={!canSubmit}
              type="primary"
              htmlType="submit"
              size="large"
              className="sendBtn"
              loading={isSubmitLoading}
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

      <GasSelector
        visible={gasSelectorVisible}
        onClose={handleGasSelectorClose}
        chainId={CHAINS[chain].id}
        onChange={(val) => {
          setAmountFocus(false);
          setGasSelectorVisible(false);
          handleGasChange(val);
        }}
        gasList={gasList}
        gas={selectedGasLevel}
        token={currentToken}
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
      <SendTokenInner key={`${currentAccount?.address}`} />;
    </Wrapper>
  );
});

export default SendToken;
