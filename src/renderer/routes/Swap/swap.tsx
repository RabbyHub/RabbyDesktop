import IconRcLoading from '@/../assets/icons/swap/loading.svg?rc';
import IconSwapArrow from '@/../assets/icons/swap/swap-arrow.svg?rc';
import RabbyInput from '@/renderer/components/AntdOverwrite/Input';
import { useCurrentAccount } from '@/renderer/hooks/rabbyx/useAccount';
import { formatAmount, formatUsdValue } from '@/renderer/utils/number';
import { InfoCircleOutlined } from '@ant-design/icons';
import { CHAINS_ENUM } from '@debank/common';
import { DEX_ENUM } from '@rabby-wallet/rabby-swap';
import { Button, Modal, Tooltip, message } from 'antd';
import clsx from 'clsx';
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
} from 'react';
import styled from 'styled-components';

import { SWAP_SUPPORT_CHAINS, useSwap } from '@/renderer/hooks/rabbyx/useSwap';
import { useTranslation } from 'react-i18next';
import { SwapReserveGasModal } from '@/renderer/components/ReserverGasPopup/SwapReserverGasModal';

import IconRcClose from '@/../assets/icons/swap/close.svg?rc';
import IconRcError from '@/../assets/icons/swap/error.svg?rc';

import { Switch } from '@/renderer/components/Switch/Switch';
import { useRbiSource } from '@/renderer/hooks/useRbiSource';
import { walletController } from '@/renderer/ipcRequest/rabbyx';
import { getTokenSymbol } from '@/renderer/utils';
import { findChain, findChainByServerID } from '@/renderer/utils/chain';
import BigNumber from 'bignumber.js';
import { useAtom } from 'jotai';
import { refreshIdAtom, useQuoteVisible, useSetQuoteVisible } from './atom';
import { ChainRender, ChainSelect } from './component/ChainSelect';
import { TokenRender } from './component/TokenRender';
import { TokenSelect } from './component/TokenSelect';
import { SwapTransactions } from './component/Transactions';
import { DEX } from './constant';
import styles from './index.module.less';
import { getSpender } from './utils';

import { useTokenPair } from './hooks/token';
import {
  useInSwap,
  usePostSwap,
  useSwapOrApprovalLoading,
} from './hooks/subscribe';
import { BestQuoteLoading } from './component/QuoteLoading';
import { ReceiveDetails } from './component/ReceiveDetail';
import { Slippage } from './component/Slippage';
import { QuoteList } from './component/Quotes';

const MaxButton = styled.img`
  cursor: pointer;
  user-select: nonce;
  margin-left: 6px;
`;

const PreferMEVGuardSwitch = styled(Switch)`
  min-width: 32px;
  width: 32px;
  height: 16px;
  &.ant-switch {
    min-width: 32px;
    &.ant-switch-checked {
      background-color: var(--r-blue-default, #7084ff) !important;
      .ant-switch-handle {
        left: calc(100% - 14px - 1px);
        top: 1px;
      }
    }
    .ant-switch-handle {
      height: 14px;
      width: 14px;
      top: 1px;
      left: 1px;
    }
  }
`;

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
    align-items: flex-start;
    gap: 24px;
  }

  .box {
    width: 530px;
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
      margin-bottom: 20px;
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
      input {
        font-size: 20px;
        font-weight: medium;
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

export const SwapToken = () => {
  const rbiSource = useRbiSource();
  const { t } = useTranslation();

  const [refreshId, setRefreshId] = useAtom(refreshIdAtom);

  const { currentAccount } = useCurrentAccount();
  const userAddress = currentAccount?.address || '';

  const quoteListVisible = useQuoteVisible();
  const setVisible = useSetQuoteVisible();

  const {
    bestQuoteDex,
    chain,
    switchChain,
    reserveGasOpen,
    closeReserveGasOpen,
    gasLevel,
    changeGasPrice,
    gasLimit,
    gasList,

    setPayAmount,
    payToken,
    setPayToken,
    receiveToken,
    setReceiveToken,
    exchangeToken,

    handleAmountChange,
    handleBalance,
    inputAmount,
    debouncePayAmount,

    payTokenIsNativeToken,
    isWrapToken,
    inSufficient,
    slippageChanged,
    setSlippageChanged,
    slippageState,
    slippage,
    setSlippage,

    openQuotesList,
    quoteLoading,
    quoteList,

    currentProvider: activeProvider,
    setActiveProvider,
    slippageValidInfo,
    expired,
  } = useTokenPair(userAddress);

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

  const activeQuoteNameRef = useRef(activeProvider?.name);

  useLayoutEffect(() => {
    activeQuoteNameRef.current = activeProvider?.name;
  }, [activeProvider?.name]);

  const DexDisplayName = useMemo(
    () => DEX?.[activeProvider?.name as keyof typeof DEX]?.name || '',
    [activeProvider?.name]
  );

  const payAmountLoading = useMemo(
    () => inputAmount !== debouncePayAmount,
    [inputAmount, debouncePayAmount]
  );

  const quoteOrAmountLoading = quoteLoading || payAmountLoading;

  const amountAvailable = useMemo(
    () => Number(debouncePayAmount) > 0,
    [debouncePayAmount]
  );

  const btnText = useMemo(() => {
    if (slippageChanged) {
      return t('page.swap.slippage-adjusted-refresh-quote');
    }
    if (activeProvider && expired) {
      return t('page.swap.price-expired-refresh-quote');
    }
    if (activeProvider?.shouldApproveToken) {
      return t('page.swap.approve-and-swap', { name: DexDisplayName });
    }
    if (activeProvider?.name) {
      return t('page.swap.swap-via-x', {
        name: isWrapToken ? 'Wrap Contract' : DexDisplayName,
      });
    }
    if (quoteOrAmountLoading) {
      return t('page.swap.title');
    }

    return t('page.swap.title');
  }, [
    slippageChanged,
    activeProvider,
    expired,
    quoteOrAmountLoading,
    t,
    DexDisplayName,
    isWrapToken,
  ]);

  const addLocalSwapTx = usePostSwap();

  const { subscribeTx } = useSwapOrApprovalLoading();

  const isTransactingRef = useRef(false);

  const { swap, setSwapPreferMEV } = useSwap();

  const { preferMEVGuarded: originPreferMEVGuarded } = swap;

  const preferMEVGuarded = useMemo(
    () => (chain === CHAINS_ENUM.ETH ? originPreferMEVGuarded : false),
    [chain, originPreferMEVGuarded]
  );

  const gotoSwap = useCallback(async () => {
    if (isTransactingRef.current) return;
    if (
      payToken?.id &&
      !activeProvider?.error &&
      activeProvider?.quote &&
      activeProvider?.gasPrice
    ) {
      isTransactingRef.current = true;

      const dexSwap = async (needApprove?: boolean) => {
        const hash = await walletController.dexSwap(
          {
            swapPreferMEVGuarded: preferMEVGuarded,
            chain,
            quote: activeProvider.quote!,
            needApprove: needApprove ?? activeProvider?.shouldApproveToken,
            spender: getSpender(activeProvider.name as DEX_ENUM, chain),
            pay_token_id: payToken.id,
            unlimited: false,
            shouldTwoStepApprove:
              needApprove ?? activeProvider?.shouldTwoStepApprove,
            gasPrice: payTokenIsNativeToken
              ? gasList?.find((e) => e.level === gasLevel)?.price
              : undefined,
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
        } else {
          throw new Error('no hash');
        }

        const shouldApproveToken =
          needApprove ?? activeProvider?.shouldApproveToken;

        if (hash && shouldApproveToken) {
          subscribeTx(hash);
        }

        if (hash && receiveToken && !shouldApproveToken) {
          setPayAmount('');
          addLocalSwapTx(chain, hash, {
            payToken,
            receiveToken,
            payAmount: debouncePayAmount,
            slippage,
            dexId: activeProvider.name,
            txId: hash,
            quote: activeProvider.quote!,
          });
        }
      };
      try {
        await dexSwap();
        if (activeProvider?.shouldApproveToken) {
          await dexSwap(false);
        }
        setPayAmount('');
      } catch (e) {
        console.error('gotoSwap error:', e);
      } finally {
        isTransactingRef.current = false;
        refresh?.();
      }
    }
  }, [
    payToken,
    activeProvider?.error,
    activeProvider?.quote,
    activeProvider?.gasPrice,
    activeProvider?.shouldApproveToken,
    activeProvider?.name,
    activeProvider?.shouldTwoStepApprove,
    preferMEVGuarded,
    chain,
    payTokenIsNativeToken,
    gasList,
    rbiSource,
    receiveToken,
    gasLevel,
    setActiveProvider,
    subscribeTx,
    setPayAmount,
    addLocalSwapTx,
    debouncePayAmount,
    slippage,
    refresh,
  ]);

  const disableBtn = useMemo(
    () =>
      !payToken ||
      !receiveToken ||
      !amountAvailable ||
      inSufficient ||
      payAmountLoading ||
      !activeProvider,
    [
      activeProvider,
      amountAvailable,
      inSufficient,
      payAmountLoading,
      payToken,
      receiveToken,
    ]
  );

  const handleSwap = useCallback(async () => {
    if (!activeProvider || expired || slippageChanged) {
      refresh();
      return;
    }
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
    if (activeProvider?.activeLoading || disableBtn) return;

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
                When swapping USDT, two transactions are required to update the
                allowance. You will need to reset the allowance to zero before
                setting a new allowance value.
              </div>
            </>
          ),
          okText: 'Proceed with Two-Step Approval',
          onOk() {
            gotoSwap();
          },
        });
      }
      gotoSwap();
    }
  }, [
    activeProvider,
    expired,
    slippageChanged,
    debouncePayAmount,
    payToken,
    receiveToken,
    disableBtn,
    refresh,
    gotoSwap,
  ]);

  const showMEVGuardedSwitch = useMemo(
    () => chain === CHAINS_ENUM.ETH,
    [chain]
  );

  const switchPreferMEV = useCallback(
    (bool: boolean) => {
      setSwapPreferMEV(bool);
    },
    [setSwapPreferMEV]
  );

  const FeeAndMEVGuarded = useMemo(
    () => (
      <>
        {isWrapToken ? (
          <div className="flex items-center justify-between text-14 text-r-neutral-body">
            <span>Slippage tolerance</span>
            <span className="font-medium text-r-neutral-title-1">
              No slippage for Wrap
            </span>
          </div>
        ) : null}

        {showMEVGuardedSwitch && (
          <div className="flex justify-between items-center">
            <Tooltip
              placement="topLeft"
              overlayClassName={clsx('rectangle', 'max-w-[312px]')}
              title={
                'Enable "MEV Guarded" feature for Ethereum swaps to reduce sandwich attack risks. Note: this feature is not supported if you use a custom RPC or wallet connect address'
              }
            >
              <span>Prefer MEV Guarded</span>
            </Tooltip>
            <Tooltip
              placement="topRight"
              overlayClassName={clsx('rectangle', 'max-w-[312px]')}
              title={
                'Enable "MEV Guarded" feature for Ethereum swaps to reduce sandwich attack risks. Note: this feature is not supported if you use a custom RPC or wallet connect address'
              }
            >
              <PreferMEVGuardSwitch
                checked={originPreferMEVGuarded}
                onChange={switchPreferMEV}
              />
            </Tooltip>
          </div>
        )}
      </>
    ),
    [isWrapToken, switchPreferMEV, showMEVGuardedSwitch, originPreferMEVGuarded]
  );

  return (
    <Wrapper>
      <div className="header">
        <div className="title">Swap</div>
        <div>Get the best rates, trade directly with the top aggregators</div>
      </div>

      <div
        className={clsx('scroll-area', quoteListVisible && 'overflow-hidden')}
      >
        <div className="content">
          <div
            className={clsx(
              'box left relative',
              !inSufficient &&
                amountAvailable &&
                !!payToken &&
                !!receiveToken &&
                'min-h-[675px]'
            )}
          >
            <div className="section">
              <div className="subText"> Chain </div>
              <ChainSelect
                value={chain}
                onChange={switchChain}
                disabledTips="Not supported"
                title="Select chain"
                supportChains={SWAP_SUPPORT_CHAINS}
                chainRender={<ChainRender chain={chain} />}
              />
            </div>
            <div className="section">
              <div className="subText">
                Swap from <span className="ml-[192px]">To</span>
              </div>
              <div className="tokenGroup">
                <TokenSelect
                  onTokenChange={(token) => {
                    const chainItem = findChainByServerID(token.chain);
                    if (chainItem?.enum !== chain) {
                      switchChain(chainItem?.enum || CHAINS_ENUM.ETH);
                      setReceiveToken(undefined);
                    }
                    setPayToken(token);
                  }}
                  chainId={findChain({ enum: chain })?.serverId || null}
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
                  onTokenChange={(token) => {
                    const chainItem = findChainByServerID(token.chain);
                    if (chainItem?.enum !== chain) {
                      switchChain(chainItem?.enum || CHAINS_ENUM.ETH);
                      setPayToken(undefined);
                    }
                    setReceiveToken(token);
                  }}
                  chainId={findChain({ enum: chain })?.serverId || null}
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
                  className={clsx('subText flex items-center')}
                  onClick={handleBalance}
                >
                  {t('global.Balance')}: {formatAmount(payToken?.amount || 0)}
                  {new BigNumber(payToken?.raw_amount_hex_str || 0, 16).gt(
                    0
                  ) && (
                    <MaxButton
                      src="rabby-internal://assets/icons/send-token/max-button.svg"
                      onClick={handleBalance}
                    />
                  )}
                </div>
              </div>
              <RabbyInput
                className="amountInput"
                placeholder="0"
                showCount={false}
                value={inputAmount}
                onChange={handleAmountChange}
                suffix={
                  <span className="text-white text-opacity-60 text-14">
                    {inputAmount
                      ? `≈ ${formatUsdValue(
                          new BigNumber(inputAmount)
                            .times(payToken?.price || 0)
                            .toString(10)
                        )}`
                      : ''}
                  </span>
                }
              />

              {!!payToken &&
                !!receiveToken &&
                quoteOrAmountLoading &&
                amountAvailable &&
                !inSufficient &&
                !activeProvider?.manualClick && <BestQuoteLoading />}

              {Number(debouncePayAmount) > 0 &&
                !inSufficient &&
                amountAvailable &&
                (!quoteOrAmountLoading ||
                  (activeProvider && !!activeProvider.manualClick)) &&
                !!payToken &&
                !!receiveToken && (
                  <>
                    <ReceiveDetails
                      bestQuoteDex={bestQuoteDex}
                      activeProvider={activeProvider}
                      isWrapToken={isWrapToken}
                      className="section mb-24"
                      payAmount={debouncePayAmount}
                      receiveRawAmount={
                        activeProvider?.actualReceiveAmount || 0
                      }
                      payToken={payToken}
                      receiveToken={receiveToken}
                      quoteWarning={activeProvider?.quoteWarning}
                      chain={chain}
                      openQuotesList={openQuotesList}
                    />
                  </>
                )}

              {Number(debouncePayAmount) > 0 &&
                (!quoteOrAmountLoading || !!activeProvider?.manualClick) &&
                !!activeProvider &&
                !!activeProvider?.quote?.toTokenAmount &&
                payToken &&
                receiveToken && (
                  <div className="section text-14 leading-normal text-r-neutral-body mt-14 px-16 mb-0">
                    <div className="mt-24 flex flex-col gap-24">
                      {isWrapToken ? (
                        <>{FeeAndMEVGuarded}</>
                      ) : (
                        <>
                          <Slippage
                            displaySlippage={slippage}
                            value={slippageState}
                            onChange={(e) => {
                              setSlippageChanged(true);
                              setSlippage(e);
                            }}
                            recommendValue={
                              slippageValidInfo?.is_valid
                                ? undefined
                                : slippageValidInfo?.suggest_slippage
                            }
                          />
                          {FeeAndMEVGuarded}
                        </>
                      )}
                    </div>
                  </div>
                )}

              <div
                className={clsx('halfTips error', !inSufficient && 'hidden')}
              >
                <IconRcError /> <span>Insufficient Balance</span>
              </div>
            </div>

            <div className="btnBox">
              <Button
                size="large"
                type="primary"
                onClick={handleSwap}
                className={clsx('btn ', disableBtn && 'disabled')}
                icon={
                  activeProvider?.activeLoading ? (
                    <IconRcLoading className="animate-spin" />
                  ) : null
                }
                disabled={
                  !payToken ||
                  !receiveToken ||
                  !amountAvailable ||
                  inSufficient ||
                  payAmountLoading ||
                  !activeProvider
                }
              >
                {btnText}
              </Button>
            </div>

            {payToken && receiveToken && chain ? (
              <QuoteList
                list={quoteList}
                loading={quoteLoading}
                visible={quoteListVisible}
                onClose={() => {
                  setVisible(false);
                }}
                chain={chain}
                payToken={payToken}
                payAmount={debouncePayAmount}
                receiveToken={receiveToken}
                inSufficient={inSufficient}
                setActiveProvider={setActiveProvider}
              />
            ) : null}
          </div>
        </div>

        <SwapReserveGasModal
          selectedItem={gasLevel}
          chain={chain}
          limit={gasLimit}
          onGasChange={changeGasPrice}
          gasList={gasList}
          visible={reserveGasOpen}
          onCancel={closeReserveGasOpen}
          rawHexBalance={payToken?.raw_amount_hex_str}
        />

        <SwapTransactions addr={userAddress} />
      </div>
    </Wrapper>
  );
};
