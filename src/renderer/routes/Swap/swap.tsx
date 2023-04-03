import { CHAINS, CHAINS_ENUM } from '@debank/common';
import { DEX_ENUM, DEX_SUPPORT_CHAINS } from '@rabby-wallet/rabby-swap';
import { useMemo, useState, useCallback, useRef, useEffect } from 'react';
import { TokenItem } from '@debank/rabby-api/dist/types';
import styled from 'styled-components';
import IconSwapArrow from '@/../assets/icons/swap/swap-arrow.svg?rc';
import RabbyInput from '@/renderer/components/AntdOverwrite/Input';
import { Button, message, Modal } from 'antd';
import { useLocation, useSearchParams } from 'react-router-dom';
import clsx from 'clsx';
import { useCurrentAccount } from '@/renderer/hooks/rabbyx/useAccount';
import { useAsync, useDebounce } from 'react-use';
import { formatAmount } from '@/renderer/utils/number';
import { InfoCircleOutlined } from '@ant-design/icons';
import IconRcClose from '@/../assets/icons/swap/close.svg?rc';
import { walletController } from '@/renderer/ipcRequest/rabbyx';
import { useRbiSource } from '@/renderer/hooks/useRbiSource';
import BigNumber from 'bignumber.js';
import { ChainRender, ChainSelect } from './component/ChainSelect';
import { SwapIntro } from './component/Intro';
import { DEX, getChainDefaultToken } from './constant';
import { TokenSelect } from './component/TokenSelect';
import { ReceiveDetails } from './component/ReceiveDetail';
import { Slippage } from './component/Slippage';
import { SwapTransactions } from './component/Transactions';
import { TokenRender } from './component/TokenRender';
import {
  getAllQuotes,
  getSpender,
  getToken,
  isSwapWrapToken,
  validSlippage,
} from './utils';
import { QuoteItemProps, QuoteProvider, Quotes } from './component/Quotes';
import styles from './index.module.less';
import { usePostSwap } from './hooks';

const Wrapper = styled.div`
  & > .header {
    position: absolute;
    top: 24px;
    left: 102px;
    font-size: 16px;
    color: white;
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
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 8px;
    padding: 24px;
  }

  .left {
    width: 528px;
    min-height: 640px;

    background: rgba(0, 0, 0, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.2);
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
        opacity: 0.6;
        &:hover {
          opacity: 1;
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
      &:focus,
      &:hover {
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
    }

    .btnBox {
      margin-top: auto;
    }

    .btn {
      margin-top: 24px;
      width: 100%;
      height: 56px;
      box-shadow: none;
      font-size: 18px;
      font-weight: medium;
      border-radius: 6px;
      position: relative;

      &:first-of-type::after {
        position: absolute;
        top: -24px;
        left: -25px;
        content: '';
        width: calc(100% + 50px);
        height: 0;
        border-top: 1px solid rgba(255, 255, 255, 0.2);
      }

      &:hover {
        box-shadow: none;
      }
      &.disabled {
        opacity: 0.6;
        /* background-color: rgba(134, 151, 255, 0.6); */
        box-shadow: none;
        border-color: transparent;
        cursor: not-allowed;
        /* color: rgba(255, 255, 255, 0.6); */
      }
    }
  }
`;

const supportChains = [...new Set(Object.values(DEX_SUPPORT_CHAINS).flat())];

export const SwapToken = () => {
  const location = useLocation();
  const rbiSource = useRbiSource();

  const [slippage, setSlippage] = useState('0.5');
  const [chain, setChain] = useState<CHAINS_ENUM>(CHAINS_ENUM.ETH);
  const chainName = useMemo(() => CHAINS[chain].name, [chain]);
  const [payToken, setPayToken] = useState<TokenItem | undefined>(
    getChainDefaultToken(CHAINS_ENUM.ETH)
  );
  const [receiveToken, setReceiveToken] = useState<TokenItem>();
  const [payAmount, setPayAmount] = useState('');
  const [refreshId, setRefreshId] = useState(0);
  const [activeProvider, setActiveProvider] = useState<QuoteProvider>();

  const [searchParams] = useSearchParams();
  const shouldResetState = useRef(false);
  const pageInfo = useMemo(() => {
    shouldResetState.current = true;
    return {
      payTokenId: searchParams.get('payTokenId'),
      chain: searchParams.get('chain'),
    };
  }, [searchParams]);

  const chainSwitch = useCallback((c: CHAINS_ENUM, payTokenId?: string) => {
    setChain(c);
    setPayToken({
      ...getChainDefaultToken(c),
      ...(payTokenId ? { id: payTokenId } : {}),
    });
    setReceiveToken(undefined);
    setPayAmount('');
    setActiveProvider(undefined);
  }, []);

  const inSwapRef = useRef(false);
  const refresh = useCallback(() => {
    if (location.pathname === '/mainwin/swap') {
      setRefreshId((e) => e + 1);
    }
  }, [location.pathname]);

  useEffect(() => {
    if (location.pathname === '/mainwin/swap') {
      inSwapRef.current = true;
    } else {
      inSwapRef.current = false;
    }
  }, [location.pathname]);

  if (inSwapRef.current) {
    refresh();
    inSwapRef.current = false;
  }

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

  const Insufficient = useMemo(
    () => Number(payAmount) > Number(payToken?.amount || 0),
    [payToken?.amount, payAmount]
  );

  const { currentAccount } = useCurrentAccount();
  const userAddress = currentAccount?.address || '';
  const [feeAfterDiscount, setFeeAfterDiscount] = useState('0.01');

  const {
    value: payTokenInfo,
    loading: payTokenLoading,
    error,
  } = useAsync(async () => {
    if (userAddress && payToken?.id && chain) {
      const data = await getToken({
        addr: userAddress,
        tokenId: payToken.id,
        chain,
      });
      return data;
    }
  }, [refreshId, userAddress, payToken?.id, chain]);

  const {
    value: dexQuotes,
    loading: quoteLoading,
    error: quotesError,
  } = useAsync(async () => {
    if (
      userAddress &&
      payToken &&
      receiveToken &&
      slippage &&
      chain &&
      payAmount &&
      feeAfterDiscount
    ) {
      return getAllQuotes({
        userAddress,
        payToken,
        receiveToken,
        slippage,
        chain,
        payAmount,
        fee: feeAfterDiscount,
      });
    }
  }, [
    refreshId,
    userAddress,
    payToken,
    receiveToken,
    slippage,
    chain,
    payAmount,
    feeAfterDiscount,
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
      slippage &&
      chain &&
      payAmount &&
      feeAfterDiscount,
    [
      chain,
      feeAfterDiscount,
      payAmount,
      payToken,
      receiveToken,
      slippage,
      userAddress,
    ]
  );

  useDebounce(
    () => {
      if (payTokenInfo && !payTokenLoading) {
        setPayToken(payTokenInfo);
      }
    },
    300,
    [payTokenInfo, payTokenLoading]
  );

  if (error) {
    console.error('payTokenInfo', error);
  }

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
    if (payToken && payToken?.id !== CHAINS[chain].nativeTokenAddress) {
      setPayAmount(`${payToken?.amount || ''}`);
    }
  }, [chain, payToken]);

  const exchangeToken = useCallback(() => {
    setPayToken(receiveToken);
    setReceiveToken(payToken);
  }, [receiveToken, payToken]);

  const selectQuote: QuoteItemProps['onClick'] = useCallback((data) => {
    setActiveProvider(data);
  }, []);

  const DexDisplayName = useMemo(
    () => DEX?.[activeProvider?.name as keyof typeof DEX]?.name || '',
    [activeProvider?.name]
  );

  const btnText = useMemo(() => {
    if (Insufficient) {
      return 'Insufficient Balance';
    }
    if (activeProvider?.name) {
      return `Swap via ${DexDisplayName}`;
    }
    return 'Select offer';
  }, [DexDisplayName, Insufficient, activeProvider?.name]);

  const btnDisabled =
    quoteLoading ||
    !activeProvider?.name ||
    activeProvider?.error ||
    !activeProvider?.quote;

  const postSwapByChainHash = usePostSwap();

  const gotoSwap = useCallback(
    async (unlimited = false) => {
      if (
        payToken?.id &&
        !activeProvider?.error &&
        activeProvider?.quote &&
        activeProvider?.gasPrice
      ) {
        try {
          const hash = await walletController.dexSwap(
            {
              chain,
              quote: activeProvider.quote,
              needApprove: activeProvider?.shouldApproveToken,
              spender: getSpender(activeProvider.name as DEX_ENUM, chain),
              pay_token_id: payToken.id,
              gasPrice: activeProvider?.gasPrice,
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
          if (hash && receiveToken) {
            postSwapByChainHash(chain, hash, {
              payToken,
              receiveToken,
              payAmount,
              slippage,
              dexId: activeProvider.name,
              txId: hash,
              quote: activeProvider.quote,
            });
          }
        } catch (e) {
          console.error('dexSwap', e);
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
      postSwapByChainHash,
      payAmount,
      slippage,
      refresh,
    ]
  );

  const handleSwap = useCallback(
    async (ulimit = false) => {
      if (payAmount && payToken && !receiveToken) {
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

      if (!activeProvider?.error && !quoteLoading && activeProvider?.quote) {
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
      payAmount,
      payToken,
      receiveToken,
      quoteLoading,
      gotoSwap,
      activeProvider?.error,
      activeProvider?.quote,
      activeProvider?.shouldTwoStepApprove,
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
                disabledTips="Not supported by the current exchange"
                title={`Select the chain supported by ${chainName}`}
                supportChains={supportChains}
                chainRender={<ChainRender chain={chain} />}
              />
            </div>
            <div className="section">
              <div className="subText"> Swap from / To </div>
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
                <div className="subText">Amount in {chainName}</div>
                <div
                  className={clsx(
                    'subText underline cursor-pointer',
                    Insufficient && 'error'
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
              />
              <div
                className={clsx(
                  'halfTips',
                  !activeProvider?.halfBetterRate && 'hidden'
                )}
              >
                Splitting your trade in half may result in a{' '}
                {activeProvider?.halfBetterRate}% better exchange rate.
              </div>
            </div>
            {!Insufficient &&
              !quoteLoading &&
              payAmount &&
              activeProvider?.quote?.toTokenAmount &&
              payToken &&
              receiveToken && (
                <ReceiveDetails
                  className="section"
                  payAmount={payAmount}
                  receiveRawAmount={activeProvider?.quote?.toTokenAmount}
                  payToken={payToken}
                  receiveToken={receiveToken}
                  quoteWarning={activeProvider?.quoteWarning}
                />
              )}
            <div className="section">
              <div className="subText text-14 text-white flex justify-between">
                <div>
                  <span className="text-opacity-60">Slippage tolerance: </span>
                  <span className="font-medium">{slippage}%</span>
                </div>
                <div>
                  <span className="text-opacity-60">Minimum received: </span>
                  <span className="font-medium">
                    {miniReceivedAmount} {receiveToken?.symbol}
                  </span>
                </div>
              </div>

              <Slippage
                value={slippage}
                onChange={setSlippage}
                recommendValue={
                  slippageValidInfo?.is_valid
                    ? undefined
                    : slippageValidInfo?.suggest_slippage
                }
              />
            </div>
            <div className="btnBox">
              {activeProvider?.shouldApproveToken ? (
                <>
                  <Button
                    size="large"
                    type="primary"
                    onClick={handleLimitedSwap}
                    className={clsx('btn ', btnDisabled && 'disabled')}
                  >
                    Approve {payAmount} {payToken?.symbol} to {DexDisplayName}{' '}
                  </Button>

                  <Button
                    size="large"
                    type="primary"
                    onClick={handleUnlimitedSwap}
                    className={clsx('btn ', btnDisabled && 'disabled')}
                  >
                    Approve Unlimited {payToken?.symbol} to {DexDisplayName}{' '}
                  </Button>
                </>
              ) : (
                <Button
                  size="large"
                  type="primary"
                  onClick={handleLimitedSwap}
                  className={clsx('btn ', btnDisabled && 'disabled')}
                >
                  {btnText}
                </Button>
              )}
            </div>
          </div>
          <div className="box">
            {renderQuotes && payToken && receiveToken ? (
              <Quotes
                list={dexQuotes}
                loading={quoteLoading}
                payToken={payToken}
                receiveToken={receiveToken}
                payAmount={payAmount}
                chain={chain}
                userAddress={userAddress}
                onClick={selectQuote}
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
