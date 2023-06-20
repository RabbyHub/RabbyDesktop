import { CHAINS, CHAINS_ENUM } from '@debank/common';
import { DEX_ENUM, DEX_SUPPORT_CHAINS } from '@rabby-wallet/rabby-swap';
import {
  useMemo,
  useState,
  useCallback,
  useRef,
  useEffect,
  useLayoutEffect,
} from 'react';
import styled from 'styled-components';
import IconSwapArrow from '@/../assets/icons/swap/swap-arrow.svg?rc';
import RabbyInput from '@/renderer/components/AntdOverwrite/Input';
import { Button, message, Modal } from 'antd';
import { useSearchParams } from 'react-router-dom';
import clsx from 'clsx';
import { useCurrentAccount } from '@/renderer/hooks/rabbyx/useAccount';
import { useAsync, useDebounce } from 'react-use';
import { formatAmount, formatUsdValue } from '@/renderer/utils/number';
import { InfoCircleOutlined } from '@ant-design/icons';
import IconRcClose from '@/../assets/icons/swap/close.svg?rc';
import IconRcLoading from '@/../assets/icons/swap/loading.svg?rc';
import IconRcError from '@/../assets/icons/swap/error.svg?rc';

import { walletController } from '@/renderer/ipcRequest/rabbyx';
import { useRbiSource } from '@/renderer/hooks/useRbiSource';
import BigNumber from 'bignumber.js';
import { isSameAddress } from '@/renderer/utils/address';
import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import { ellipsisTokenSymbol } from '@/renderer/utils/token';
import { getTokenSymbol } from '@/renderer/utils';
import { ChainRender, ChainSelect } from './component/ChainSelect';
import { SwapIntro } from './component/Intro';
import { DEX, getChainDefaultToken } from './constant';
import { TokenSelect } from './component/TokenSelect';
import { ReceiveDetails } from './component/ReceiveDetail';
import { Slippage } from './component/Slippage';
import { SwapTransactions } from './component/Transactions';
import { TokenRender } from './component/TokenRender';
import {
  TCexQuoteData,
  TDexQuoteData,
  getAllQuotes,
  getSpender,
  isSwapWrapToken,
  tokenAmountBn,
  validSlippage,
} from './utils';
import { Quotes } from './component/Quotes';
import styles from './index.module.less';
import {
  useInSwap,
  usePostSwap,
  useSwapOrApprovalLoading,
  useSwapSettings,
  useTokenPair,
} from './hooks';
import {
  activeProviderAtom,
  activeProviderOriginAtom,
  refreshIdAtom,
} from './atom';

const Wrapper = styled.div`
  --max-swap-width: 1080px;

  & > .header {
    width: var(--max-swap-width);
    position: absolute;
    top: 24px;
    left: 50%;
    transform: translateX(-50%);
    font-size: 16px;
    color: white;
    z-index: -1;
    .title {
      font-size: 28px;
      font-weight: medium;
    }
  }
  .scroll-area {
    overflow: overlay;
    margin-top: 32px;
    padding-top: 26px;
    height: calc(100vh - var(--mainwin-headerblock-offset) - 32px);
  }
  .titleBox {
    color: white;
    .title {
      font-size: 28px;
      font-weight: medium;
      margin-bottom: 12px;
    }
    .subtitle {
      font-size: 16px;
      position: absolute;
      left: 20;
      top: 20;
    }
  }

  .content {
    display: flex;
    justify-content: center;
    gap: 24px;
  }

  .box {
    width: 528px;
    min-height: 640px;

    background: rgba(0, 0, 0, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.15);
    border-radius: 8px;
    padding: 24px;
  }

  .left {
    width: 528px;
    min-height: 640px;

    background: rgba(0, 0, 0, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.15);
    border-radius: 8px;
    padding: 24px;

    display: flex;
    flex-direction: column;

    .section {
      margin-bottom: 24px;
    }

    .subText {
      font-size: 14px;
      color: rgba(255, 255, 255, 0.6);
      margin-bottom: 8px;

      &.error {
        color: #ff7878;
      }
    }

    .tokenGroup {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .tokenBox {
      background: rgba(0, 0, 0, 0.2);
      border-radius: 6px;
      width: 212px;
      height: 64px;
    }

    .swap-arrow {
      width: 24px;
      height: 24px;
      svg {
        cursor: pointer;
        width: 24px;
        height: 24px;
        color: rgba(255, 255, 255, 0.6);
        &:hover {
          color: rgba(255, 255, 255, 1);
        }
      }
    }

    .amountBox {
      display: flex;
      justify-content: space-between;
    }

    .amountInput {
      background: rgba(0, 0, 0, 0.2);
      border: 1px solid rgba(255, 255, 255, 0.4);
      border-radius: 6px;
      height: 64px;
      font-size: 20px;
      font-weight: medium;
      color: #ffffff;
      box-shadow: none;
      &:focus,
      &:hover,
      &:active {
        border: 1px solid rgba(255, 255, 255, 0.8);
        box-shadow: none;
      }

      &:placeholder-shown {
        opacity: 0.6;
      }
      &::-webkit-inner-spin-button,
      &::-webkit-outer-spin-button {
        -webkit-appearance: none;
        margin: 0;
      }
    }

    .halfTips {
      margin-top: 12px;
      color: rgba(255, 255, 255, 0.8);
      font-size: 14px;
      font-weight: 400;
      &.error {
        font-weight: 400;
        font-size: 14px;
        color: #ff7878;
        display: flex;
        align-items: center;
        gap: 4px;
      }
    }

    .btnBox {
      margin-top: auto;
      padding-top: 24px;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .btn {
      width: 100%;
      height: 56px;
      box-shadow: none;
      font-size: 18px;
      font-weight: medium;
      border-radius: 6px;
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;

      &:hover {
        box-shadow: 0px 16px 40px rgba(29, 35, 74, 0.2);
      }

      &:first-of-type::after {
        position: absolute;
        top: -24px;
        left: -25px;
        content: '';
        width: calc(100% + 50px);
        height: 0;
        border-top: 1px solid rgba(255, 255, 255, 0.15);
      }
      &.disabled {
        opacity: 0.6;
        box-shadow: none;
        border-color: transparent;
        cursor: not-allowed;
      }
    }
  }
`;

const supportChains = [...new Set(Object.values(DEX_SUPPORT_CHAINS).flat())];

export const SwapToken = () => {
  const rbiSource = useRbiSource();

  const [slippageState, setSlippage] = useState('0.1');
  const [chain, setChain] = useState<CHAINS_ENUM>(CHAINS_ENUM.ETH);

  const [payAmount, setPayAmount] = useState('');
  const [debouncePayAmount, setDebouncePayAmount] = useState('');

  const [refreshId, setRefreshId] = useAtom(refreshIdAtom);

  const activeProvider = useAtomValue(activeProviderAtom);
  const setActiveProvider = useSetAtom(activeProviderOriginAtom);

  const [searchParams] = useSearchParams();
  const shouldResetState = useRef(false);
  const pageInfo = useMemo(() => {
    shouldResetState.current = true;
    return {
      payTokenId: searchParams.get('payTokenId'),
      chain: searchParams.get('chain'),
    };
  }, [searchParams]);

  const slippage = useMemo(() => slippageState || '0.1', [slippageState]);

  const [disableSwapBySlippageChanged, setDisableSwapBySlippageChanged] =
    useState(false);

  const slippageChange = (s: string) => {
    setSlippage((pre) => {
      if (pre !== s) {
        setDisableSwapBySlippageChanged(true);
      }
      return s;
    });
  };

  const { currentAccount } = useCurrentAccount();
  const userAddress = currentAccount?.address || '';

  const { payToken, setPayToken, receiveToken, setReceiveToken } = useTokenPair(
    userAddress,
    chain
  );

  const payTokenIsNativeToken = useMemo(() => {
    if (payToken) {
      return isSameAddress(payToken.id, CHAINS[chain].nativeTokenAddress);
    }
    return false;
  }, [chain, payToken]);

  const chainSwitch = useCallback(
    (c: CHAINS_ENUM, payTokenId?: string) => {
      setChain(c);
      setPayToken({
        ...getChainDefaultToken(c),
        ...(payTokenId ? { id: payTokenId } : {}),
      });
      setReceiveToken(undefined);
      setPayAmount('');
      setActiveProvider(undefined);
    },
    [setActiveProvider, setPayToken, setReceiveToken]
  );

  const isInSwap = useInSwap();
  const refresh = useCallback(() => {
    if (isInSwap) {
      setRefreshId();
    }
  }, [isInSwap, setRefreshId]);

  useEffect(() => {
    if (isInSwap) {
      refresh();
    }
  }, [isInSwap, refresh]);

  if (shouldResetState.current && pageInfo.chain && pageInfo.payTokenId) {
    if (
      !supportChains.map((e) => CHAINS[e].serverId).includes(pageInfo?.chain)
    ) {
      chainSwitch(CHAINS_ENUM.ETH);
    }
    const target = Object.values(CHAINS).find(
      (item) => item.serverId === pageInfo.chain
    );
    if (target) {
      chainSwitch(target?.enum, pageInfo.payTokenId);
    }
  }
  shouldResetState.current = false;

  const inSufficient = useMemo(
    () =>
      payToken
        ? tokenAmountBn(payToken).lt(debouncePayAmount)
        : new BigNumber(0).lt(debouncePayAmount),
    [payToken, debouncePayAmount]
  );

  const [feeAfterDiscount, setFeeAfterDiscount] = useState('0.01');

  const fetchIdRef = useRef(0);
  const [quoteList, setQuotesList] = useState<
    (TCexQuoteData | TDexQuoteData)[]
  >([]);

  useEffect(() => {
    setQuotesList([]);
  }, [payToken?.id, receiveToken?.id, chain, debouncePayAmount]);

  const activeQuoteNameRef = useRef(activeProvider?.name);

  useLayoutEffect(() => {
    activeQuoteNameRef.current = activeProvider?.name;
  }, [activeProvider?.name]);

  const enableSwapBySlippageChanged = useCallback((id: number) => {
    if (id === fetchIdRef.current) {
      setDisableSwapBySlippageChanged(false);
    }
  }, []);

  const setQuote = useCallback(
    (id: number) => (quote: TCexQuoteData | TDexQuoteData) => {
      if (id === fetchIdRef.current) {
        setQuotesList((e) => {
          const index = e.findIndex((q) => q.name === quote.name);
          // setActiveProvider((activeQuote) => {
          //   if (activeQuote?.name === quote.name) {
          //     return undefined;
          //   }
          //   return activeQuote;
          // });

          const v = { ...quote, loading: false };
          if (index === -1) {
            return [...e, v];
          }
          e[index] = v;
          return [...e];
        });
      }
    },
    []
  );

  const { swapViewList, swapSettingVisible } = useSwapSettings();
  const { loading: quoteLoading, error: quotesError } = useAsync(async () => {
    fetchIdRef.current += 1;
    const currentFetchId = fetchIdRef.current;
    if (
      !swapSettingVisible &&
      userAddress &&
      payToken?.id &&
      receiveToken?.id &&
      receiveToken &&
      chain &&
      debouncePayAmount &&
      feeAfterDiscount
    ) {
      setActiveProvider((e) => (e ? { ...e, halfBetterRate: '' } : e));
      setQuotesList((e) => e.map((q) => ({ ...q, loading: true })));
      return getAllQuotes({
        userAddress,
        payToken,
        receiveToken,
        slippage: slippage || '0.1',
        chain,
        payAmount: debouncePayAmount,
        fee: feeAfterDiscount,
        setQuote: setQuote(currentFetchId),
        swapViewList,
      }).finally(() => {
        enableSwapBySlippageChanged(currentFetchId);
      });
    }
  }, [
    setActiveProvider,
    setQuotesList,
    setQuote,
    refreshId,
    userAddress,
    payToken?.id,
    receiveToken?.id,
    chain,
    debouncePayAmount,
    feeAfterDiscount,
    slippage,
    swapSettingVisible,
  ]);

  const {
    value: slippageValidInfo,
    error: slippageValidError,
    loading: slippageValidLoading,
  } = useAsync(async () => {
    if (chain && Number(slippage) && payToken?.id && receiveToken?.id) {
      return validSlippage({
        chain,
        slippage,
        payTokenId: payToken?.id,
        receiveTokenId: receiveToken?.id,
      });
    }
  }, [slippage, chain, payToken?.id, receiveToken?.id, refreshId]);

  const renderQuotes = useMemo(
    () =>
      userAddress &&
      payToken &&
      receiveToken &&
      chain &&
      +debouncePayAmount > 0 &&
      feeAfterDiscount,
    [
      userAddress,
      payToken,
      receiveToken,
      chain,
      debouncePayAmount,
      feeAfterDiscount,
    ]
  );

  useDebounce(
    () => {
      setDebouncePayAmount(payAmount);
    },
    300,
    [payAmount]
  );

  const miniReceivedAmount = useMemo(() => {
    if (activeProvider?.quote?.toTokenAmount) {
      const receivedTokeAmountBn = new BigNumber(
        activeProvider?.quote?.toTokenAmount
      ).div(
        10 **
          (activeProvider?.quote?.toTokenDecimals ||
            receiveToken?.decimals ||
            1)
      );
      return formatAmount(
        receivedTokeAmountBn
          .minus(receivedTokeAmountBn.times(slippage).div(100))
          .toString(10)
      );
    }
    return '';
  }, [
    activeProvider?.quote?.toTokenAmount,
    activeProvider?.quote?.toTokenDecimals,
    receiveToken?.decimals,
    slippage,
  ]);

  const handleAmountChange: React.ChangeEventHandler<HTMLInputElement> =
    useCallback((e) => {
      const v = e.target.value;
      if (!/^\d*(\.\d*)?$/.test(v)) {
        return;
      }
      setPayAmount(v);
    }, []);

  const handleBalance = useCallback(() => {
    if (!payTokenIsNativeToken && payToken) {
      setPayAmount(tokenAmountBn(payToken).toString(10));
    }
  }, [payToken, payTokenIsNativeToken]);

  const exchangeToken = useCallback(() => {
    setPayToken(receiveToken);
    setReceiveToken(payToken);
  }, [setPayToken, receiveToken, setReceiveToken, payToken]);

  const DexDisplayName = useMemo(
    () => DEX?.[activeProvider?.name as keyof typeof DEX]?.name || '',
    [activeProvider?.name]
  );

  const isWrapToken = useMemo(
    () =>
      payToken?.id &&
      receiveToken?.id &&
      chain &&
      isSwapWrapToken(payToken?.id, receiveToken?.id, chain),
    [chain, payToken?.id, receiveToken?.id]
  );

  const btnText = useMemo(() => {
    if (activeProvider?.name) {
      return `Swap via ${isWrapToken ? 'Wrap Contract' : DexDisplayName}`;
    }
    if (!receiveToken || !payToken) {
      return 'Select token';
    }
    return 'Select offer';
  }, [
    activeProvider?.name,
    receiveToken,
    payToken,
    isWrapToken,
    DexDisplayName,
  ]);

  const btnDisabled =
    disableSwapBySlippageChanged ||
    inSufficient ||
    !payToken ||
    !receiveToken ||
    !debouncePayAmount ||
    !activeProvider?.name ||
    activeProvider?.error ||
    !activeProvider?.quote;

  const addLocalSwapTx = usePostSwap();

  const { subscribeTx } = useSwapOrApprovalLoading();

  const [isInfiniteApproval, setIsInfiniteApproval] = useState(false);

  const gotoSwap = useCallback(
    async (unlimited = false) => {
      if (
        payToken?.id &&
        !activeProvider?.error &&
        activeProvider?.quote &&
        activeProvider?.gasPrice
      ) {
        try {
          setIsInfiniteApproval(unlimited);
          const hash = await walletController.dexSwap(
            {
              chain,
              quote: activeProvider.quote,
              needApprove: activeProvider?.shouldApproveToken,
              spender: getSpender(activeProvider.name as DEX_ENUM, chain),
              pay_token_id: payToken.id,
              unlimited,
              shouldTwoStepApprove: activeProvider?.shouldTwoStepApprove,
            },
            {
              ga: {
                category: 'Swap',
                source: 'swap',
                trigger: rbiSource,
              },
            }
          );

          if (hash) {
            setActiveProvider((e) =>
              !e
                ? e
                : {
                    ...e,
                    activeLoading: true,
                    activeTx: hash,
                  }
            );
          }

          if (hash && activeProvider?.shouldApproveToken) {
            subscribeTx(hash);
          }

          if (hash && receiveToken && !activeProvider?.shouldApproveToken) {
            setPayAmount('');
            addLocalSwapTx(chain, hash, {
              payToken,
              receiveToken,
              payAmount: debouncePayAmount,
              slippage,
              dexId: activeProvider.name,
              txId: hash,
              quote: activeProvider.quote,
            });
          }
        } catch (e) {
          console.error('gotoSwap error:', e);
        } finally {
          refresh?.();
        }
      }
    },
    [
      payToken,
      activeProvider?.error,
      activeProvider?.quote,
      activeProvider?.gasPrice,
      activeProvider?.shouldApproveToken,
      activeProvider?.name,
      activeProvider?.shouldTwoStepApprove,
      chain,
      rbiSource,
      receiveToken,
      setActiveProvider,
      subscribeTx,
      addLocalSwapTx,
      debouncePayAmount,
      slippage,
      refresh,
    ]
  );

  const handleSwap = useCallback(
    async (ulimit = false) => {
      if (debouncePayAmount && payToken && !receiveToken) {
        message.error({
          className: 'rabbyx-tx-changed-tip',
          icon: (
            <InfoCircleOutlined
              className={clsx(
                'pb-2 self-start transform rotate-180 origin-center text-red-light'
              )}
            />
          ),
          content: 'Please select receive token',
        });
        return;
      }
      if (activeProvider?.activeLoading || btnDisabled) return;

      if (!activeProvider?.error && activeProvider?.quote) {
        if (activeProvider?.shouldTwoStepApprove) {
          return Modal.confirm({
            closable: true,
            centered: true,
            className: styles.approvalModal,
            title: null,
            icon: null,

            closeIcon: <IconRcClose />,

            content: (
              <>
                <div className={styles.title}>
                  Two-Step Approval for USDT Swap{' '}
                </div>
                <div className={styles.desc}>
                  When swapping USDT, two transactions are required to update
                  the allowance. You will need to reset the allowance to zero
                  before setting a new allowance value.
                </div>
              </>
            ),
            okText: 'Proceed with Two-Step Approval',
            onOk() {
              gotoSwap(ulimit);
            },
          });
        }
        gotoSwap(ulimit);
      }
    },
    [
      activeProvider?.activeLoading,
      activeProvider?.error,
      activeProvider?.quote,
      activeProvider?.shouldTwoStepApprove,
      btnDisabled,
      debouncePayAmount,
      payToken,
      receiveToken,
      gotoSwap,
    ]
  );

  const handleUnlimitedSwap = useCallback(() => handleSwap(true), [handleSwap]);
  const handleLimitedSwap = useCallback(() => handleSwap(), [handleSwap]);

  useEffect(() => {
    if (
      payToken?.id &&
      receiveToken?.id &&
      isSwapWrapToken(payToken?.id, receiveToken?.id, chain)
    ) {
      setFeeAfterDiscount('0');
    } else {
      setFeeAfterDiscount('0.01');
    }
  }, [chain, payToken?.id, receiveToken?.id]);

  useEffect(() => {
    if (
      inSufficient ||
      !payToken ||
      !receiveToken ||
      !debouncePayAmount ||
      activeProvider?.error ||
      !activeProvider?.quote
    ) {
      setActiveProvider(undefined);
    }
  }, [
    payToken,
    receiveToken,
    debouncePayAmount,
    activeProvider,
    inSufficient,
    setActiveProvider,
  ]);

  const receiveSlippageLoading = useMemo(
    () =>
      activeProvider?.name
        ? !quoteList?.find((e) => e.name === activeProvider?.name)
        : false,
    [activeProvider?.name, quoteList]
  );

  const disableBtn = useMemo(
    () =>
      activeProvider?.activeLoading ||
      btnDisabled ||
      !quoteList.some((e) => e.name === activeProvider?.name),
    [
      activeProvider?.activeLoading,
      activeProvider?.name,
      btnDisabled,
      quoteList,
    ]
  );

  return (
    <Wrapper>
      <div className="header">
        <div className="title">Swap</div>
        <div>Get the best rates, trade directly with the top aggregators</div>
      </div>

      <div className="scroll-area">
        <div className="content">
          <div className="box left">
            <div className="section">
              <div className="subText"> Chain </div>
              <ChainSelect
                value={chain}
                onChange={chainSwitch}
                disabledTips="Not supported"
                title="Select chain"
                supportChains={supportChains}
                chainRender={<ChainRender chain={chain} />}
              />
            </div>
            <div className="section">
              <div className="subText">
                Swap from <span className="ml-[192px]">To</span>
              </div>
              <div className="tokenGroup">
                <TokenSelect
                  onTokenChange={setPayToken}
                  chainId={CHAINS[chain].serverId}
                  token={payToken}
                  type="swapFrom"
                  excludeTokens={
                    receiveToken?.id ? [receiveToken?.id] : undefined
                  }
                  tokenRender={TokenRender}
                />
                <div
                  className="swap-arrow hover:rotate-180 transition-transform"
                  onClick={exchangeToken}
                >
                  <IconSwapArrow />
                </div>
                <TokenSelect
                  onTokenChange={setReceiveToken}
                  chainId={CHAINS[chain].serverId}
                  token={receiveToken}
                  type="swapTo"
                  tokenRender={TokenRender}
                  excludeTokens={payToken?.id ? [payToken?.id] : undefined}
                />
              </div>
            </div>
            <div className="section">
              <div className="amountBox">
                <div className="subText">
                  Amount in {getTokenSymbol(payToken) || ''}
                </div>
                <div
                  className={clsx(
                    'subText',
                    !payTokenIsNativeToken && 'underline cursor-pointer'
                    // inSufficient && 'error'
                  )}
                  onClick={handleBalance}
                >
                  Balance: {formatAmount(payToken?.amount || 0)}
                </div>
              </div>
              <RabbyInput
                className="amountInput"
                placeholder="0"
                showCount={false}
                value={payAmount}
                onChange={handleAmountChange}
                suffix={
                  <span className="text-white text-opacity-80 text-13">
                    {payAmount
                      ? `≈ ${formatUsdValue(
                          new BigNumber(payAmount)
                            .times(payToken?.price || 0)
                            .toString(10)
                        )}`
                      : ''}
                  </span>
                }
              />

              <div
                className={clsx('halfTips error', !inSufficient && 'hidden')}
              >
                <IconRcError /> <span>Insufficient Balance</span>
              </div>
            </div>
            {debouncePayAmount &&
              activeProvider?.quote?.toTokenAmount &&
              payToken &&
              receiveToken && (
                <>
                  <ReceiveDetails
                    className="section"
                    payAmount={debouncePayAmount}
                    receiveRawAmount={activeProvider?.actualReceiveAmount}
                    payToken={payToken}
                    receiveToken={receiveToken}
                    quoteWarning={activeProvider?.quoteWarning}
                    loading={receiveSlippageLoading}
                  />
                  {isWrapToken ? (
                    <div className="mb-18 text-white">
                      There is no fee and slippage for this trade
                    </div>
                  ) : (
                    <div className="section">
                      <div className="subText text-14 text-white flex justify-between">
                        <div>
                          <span className="text-white text-opacity-60">
                            Slippage tolerance:{' '}
                          </span>
                          <span className="font-medium">{slippage}%</span>
                        </div>
                        {!receiveSlippageLoading && (
                          <div>
                            <span className="text-white text-opacity-60">
                              Minimum received:{' '}
                            </span>
                            <span className="font-medium">
                              {miniReceivedAmount}{' '}
                              {getTokenSymbol(receiveToken)}
                            </span>
                          </div>
                        )}
                      </div>
                      <Slippage
                        value={slippageState}
                        onChange={slippageChange}
                        recommendValue={
                          slippageValidInfo?.is_valid
                            ? undefined
                            : slippageValidInfo?.suggest_slippage
                        }
                      />
                    </div>
                  )}
                </>
              )}

            <div className="btnBox">
              {activeProvider?.shouldApproveToken ? (
                <>
                  <Button
                    size="large"
                    type="primary"
                    onClick={handleLimitedSwap}
                    className={clsx('btn ', disableBtn && 'disabled')}
                    icon={
                      activeProvider?.activeLoading && !isInfiniteApproval ? (
                        <IconRcLoading className="animate-spin" />
                      ) : null
                    }
                  >
                    Approve {ellipsisTokenSymbol(debouncePayAmount, 16)}{' '}
                    {ellipsisTokenSymbol(getTokenSymbol(payToken) || '', 5)} to{' '}
                    {DexDisplayName}{' '}
                  </Button>

                  <Button
                    size="large"
                    type="primary"
                    onClick={handleUnlimitedSwap}
                    className={clsx('btn ', disableBtn && 'disabled')}
                    icon={
                      activeProvider?.activeLoading && isInfiniteApproval ? (
                        <IconRcLoading className="animate-spin" />
                      ) : null
                    }
                  >
                    Approve Unlimited {getTokenSymbol(payToken)} to{' '}
                    {DexDisplayName}{' '}
                  </Button>
                </>
              ) : (
                <Button
                  size="large"
                  type="primary"
                  onClick={handleLimitedSwap}
                  className={clsx('btn ', disableBtn && 'disabled')}
                  icon={
                    activeProvider?.activeLoading ? (
                      <IconRcLoading className="animate-spin" />
                    ) : null
                  }
                >
                  {btnText}
                </Button>
              )}
            </div>
          </div>
          <div className="box">
            {renderQuotes && payToken && receiveToken ? (
              <Quotes
                inSufficient={inSufficient}
                list={quoteList}
                loading={quoteLoading}
                payToken={payToken}
                receiveToken={receiveToken}
                payAmount={debouncePayAmount}
                chain={chain}
                userAddress={userAddress}
                activeName={activeProvider?.name}
                slippage={slippage}
                fee={feeAfterDiscount}
                refresh={refresh}
              />
            ) : (
              <SwapIntro />
            )}
          </div>
        </div>

        <SwapTransactions addr={userAddress} />
      </div>
    </Wrapper>
  );
};
