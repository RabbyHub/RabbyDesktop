import { memo, useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { CHAINS, CHAINS_ENUM, formatTokenAmount } from '@debank/common';

import {
  useAsync,
  useAsyncFn,
  useDebounce,
  useLocation,
  useToggle,
} from 'react-use';
import clsx from 'clsx';
import styled from 'styled-components';
import BigNumber from 'bignumber.js';
import { Alert, Button, Modal, Skeleton, Switch } from 'antd';
import { InfoCircleOutlined } from '@ant-design/icons';

import {
  DEX_ENUM,
  DEX_SPENDER_WHITELIST,
  getQuote,
  WrapTokenAddressMap,
} from '@rabby-wallet/rabby-swap';
import { GasLevel, TokenItem } from '@debank/rabby-api/dist/types';
import { useCurrentAccount } from '@/renderer/hooks/rabbyx/useAccount';
import { useSwap } from '@/renderer/hooks/rabbyx/useSwap';
import { walletController, walletOpenapi } from '@/renderer/ipcRequest/rabbyx';
import { isSameAddress } from '@/renderer/utils/address';
import { splitNumberByStep } from '@/renderer/utils/number';
import { query2obj } from '@/renderer/utils/url';
import { hideMainwinPopupview } from '@/renderer/ipcRequest/mainwin-popupview';

import ButtonMax from '@/../assets/icons/swap/max.svg';

import IconLoading from '@/../assets/icons/swap/loading.svg?rc';
import IconSwitchToken from '@/../assets/icons/swap/switch-token.svg?rc';
import IconRcClose from '@/../assets//icons/swap/close.svg?rc';

import { DexSelectDrawer } from './component/DexSelect';
import { Fee, FeeProps } from './component/Fee';
import { GasSelector } from './component/GasSelector';
import { IconRefresh } from './component/IconRefresh';
import { useGasAmount, useVerifySdk } from './hooks';

import { Slippage } from './component/Slippage';
import { Header } from './component/Header';

import styles from './index.module.less';
import { ChainSelect } from './component/ChainSelect';
import {
  SWAP_FEE_ADDRESS,
  getChainDefaultToken,
  defaultGasFee,
  TIPS,
  DEX,
} from './constant';
import { TokenSelect } from './component/TokenSelect';

const { confirm } = Modal;

const SwapTokenWrapper = styled.div`
  height: 103px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 16px;
  padding-bottom: 14px;

  background: #505664;
  border-radius: 4px;
  font-weight: 400;
  font-size: 12px;
  line-height: 14px;
  color: #a9aaae;
`;

const FooterWrapper = styled.div`
  position: absolute;
  left: 0;
  bottom: 0;
  width: 100%;
  border-top: 1px solid #4f5666;
  padding: 10px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 15px;
  .box {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-top: 5px;
  }
  .tips {
    font-weight: 500;
    font-size: 13px;
    line-height: 15px;
    color: #fff;

    .swapTips {
      color: #b4bdcc;
    }
  }

  .allowance {
    display: flex;
    align-items: center;
    gap: 7px;
    font-style: normal;
    font-weight: 400;
    font-size: 12px;
    line-height: 14px;
    text-align: right;
    color: #b4bdcc;
    &.unLimit {
      /* color: var(--color-border); */
    }
    .ant-switch {
      min-width: 32px;
      background-color: rgba(180, 189, 204, 0.5);
      &:focus,
      &:hover {
        box-shadow: none;
      }
    }
    .ant-click-animating-node {
      display: none;
    }
    .ant-switch-checked {
      background: #27c193;
      &:focus,
      &:hover {
        box-shadow: none;
      }
    }
    .ant-switch-handle::before {
      background-color: #464c59;
    }
  }

  .ant-btn-primary {
    height: 47px;
    width: 317px;
    border-radius: 8px;
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 8px;
  }

  .ant-btn-primary.disabled {
    background-color: var(--color-disabled-bg);
    box-shadow: none;
    border-color: transparent;
    cursor: not-allowed;
    color: rgba(255, 255, 255, 0.6);
  }
  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
  .animate-spin {
    animation: spin 1s linear infinite;
  }
`;

export const Swap = ({
  quickWindowOpen = true,
}: {
  quickWindowOpen?: boolean;
}) => {
  const domRef = useRef<HTMLDivElement>(null);

  const { currentAccount } = useCurrentAccount();
  const userAddress = currentAccount?.address || '';
  const swapState = useSwap();
  const { swap } = swapState;
  const lastSelectedDex = swap.selectedDex;
  const lastSelectedChain = swap.selectedChain || CHAINS_ENUM.ETH;
  const { unlimitedAllowance = false } = swap;
  const { search } = useLocation();
  const [searchObj] = useState<{
    payTokenId?: string;
    chain?: string;
  }>(query2obj(search || ''));

  const [refreshId, setRefreshId] = useState(0);

  const [dexId, setDexId] = useState(() => lastSelectedDex);

  const setUnlimited = (bool: boolean) => {
    swapState.setUnlimitedAllowance(bool);
  };

  const [visible, toggleVisible] = useToggle(false);

  const [chain, setChain] = useState(lastSelectedChain);

  const [payAmount, setAmount] = useState('');
  const [feeRate, setFeeRate] = useState<FeeProps['fee']>('0.3');
  const [slippage, setSlippage] = useState('0.5');
  const [gasLevel, setGasLevel] = useState<GasLevel>(defaultGasFee);

  const [payToken, setPayToken] = useState<TokenItem | undefined>(() =>
    getChainDefaultToken(chain)
  );
  const [receiveToken, setReceiveToken] = useState<TokenItem | undefined>(
    undefined
  );

  const saveSelectedChain = useCallback(
    (v: CHAINS_ENUM) => {
      setChain(v);
      swapState.setLastSelectedSwapChain(v);
    },
    [swapState?.setLastSelectedSwapChain]
  );

  useMemo(() => {
    if (searchObj.chain && searchObj.payTokenId) {
      const target = Object.values(CHAINS).find(
        (item) => item.serverId === searchObj.chain
      );
      if (target) {
        saveSelectedChain(target?.enum);
        setPayToken({
          ...getChainDefaultToken(target?.enum),
          id: searchObj.payTokenId,
        });
      }
    }
  }, [searchObj.chain, searchObj.payTokenId, saveSelectedChain]);

  const payTokenIsNativeToken = useMemo(
    () => payToken?.id === CHAINS[chain].nativeTokenAddress,
    [payToken?.id, chain]
  );

  const [isWrapToken, wrapTokenSymbol] = useMemo(() => {
    if (payToken?.id && receiveToken?.id) {
      const wrapTokens = [
        // @ts-expect-error
        WrapTokenAddressMap[chain],
        CHAINS[chain].nativeTokenAddress,
      ];
      const res =
        !!wrapTokens.find((token) => isSameAddress(payToken?.id, token)) &&
        !!wrapTokens.find((token) => isSameAddress(receiveToken?.id, token));
      setDexId(res ? DEX_ENUM.WRAPTOKEN : lastSelectedDex);
      return [
        res,
        // @ts-expect-error
        isSameAddress(payToken?.id, WrapTokenAddressMap[chain])
          ? payToken.symbol
          : receiveToken.symbol,
      ];
    }
    setDexId(lastSelectedDex);
    return [false, ''];
  }, [
    payToken?.id,
    payToken?.symbol,
    receiveToken?.id,
    receiveToken?.symbol,
    lastSelectedDex,
    chain,
  ]);

  const [logo, name] = useMemo(() => {
    if (lastSelectedDex) {
      // @ts-expect-error
      return [DEX[lastSelectedDex].logo, DEX[lastSelectedDex].name];
    }
    return ['', ''];
  }, [lastSelectedDex]);

  const { value: gasMarket } = useAsync(async () => {
    return walletOpenapi.gasMarket(CHAINS[chain].serverId);
  }, [chain]);

  const { value: nativeToken, loading: nativeTokenLoading } =
    useAsync(async () => {
      if (chain && userAddress) {
        const t = await walletOpenapi.getToken(
          userAddress,
          CHAINS[chain].serverId,
          CHAINS[chain].nativeTokenAddress
        );

        return t;
      }
      return undefined;
    }, [userAddress, chain]);

  const { loading: payTokenLoading } = useAsync(async () => {
    if (userAddress && payToken?.id && chain && payToken?.time_at === 0) {
      const t = await walletOpenapi.getToken(
        userAddress,
        CHAINS[chain].serverId,
        payToken?.id
      );

      setPayToken(t);
    }
  }, [userAddress, chain, payToken?.id, payToken?.time_at, refreshId]);

  const [{ value: quoteInfo, loading }, fetchQuote] = useAsyncFn(async () => {
    if (
      !userAddress ||
      !dexId ||
      !chain ||
      !payToken?.id ||
      !payToken?.decimals ||
      !receiveToken?.id ||
      !payAmount ||
      !feeRate
    ) {
      return;
    }

    try {
      const data = await getQuote(dexId, {
        fromToken: payToken.id,
        toToken: receiveToken.id,
        feeAddress: SWAP_FEE_ADDRESS,
        fromTokenDecimals: payToken.decimals,
        amount: new BigNumber(payAmount)
          .times(10 ** payToken.decimals)
          .toFixed(0, 1),
        userAddress,
        slippage: Number(slippage),
        feeRate: Number(feeRate) || 0,
        chain,
      });

      return data;
    } catch (error) {
      console.error('getQuote error ', error);
    }
    return undefined;
  }, [
    userAddress,
    dexId,
    chain,
    payAmount,
    payToken?.id,
    payToken?.decimals,
    receiveToken?.id,
    feeRate,
    slippage,
  ]);

  const {
    isSdkDataPass,
    tokenLoading,
    tokenPass,
    payTokenPass,
    receiveTokenPass,

    tokenApproved,
    shouldTwoStepApprove,
  } = useVerifySdk({
    chain,
    dexId,
    slippage,
    data: quoteInfo &&
      payToken &&
      receiveToken && {
        ...quoteInfo,
        fromToken: payToken.id,
        fromTokenAmount: new BigNumber(payAmount)
          .times(10 ** payToken.decimals)
          .toFixed(0, 1),
        toToken: receiveToken?.id,
      },
    payToken,
    receiveToken,
    payAmount,
  });

  const { totalGasUsed, totalGasUsedLoading } = useGasAmount({
    chain,
    data: quoteInfo,
    payToken,
    receiveToken,
    dexId,
    gasMarket,
    gasLevel,
    tokenApproved,
    shouldTwoStepApprove,
    userAddress,
    refreshId,
    payAmount,
  });

  const [payTokenUsdDisplay, payTokenUsdBn] = useMemo(() => {
    const payTokenUsd = new BigNumber(payAmount || 0).times(
      payToken?.price || 0
    );
    return [payTokenUsd.toFixed(2), payTokenUsd];
  }, [payAmount, payToken]);

  const [receivedTokeAmountDisplay, receivedTokeAmountBn] = useMemo(() => {
    let v = new BigNumber(0);
    if (quoteInfo?.toTokenAmount) {
      v = v
        .plus(quoteInfo?.toTokenAmount)
        .div(10 ** (quoteInfo?.toTokenDecimals || receiveToken?.decimals || 0));

      return [formatTokenAmount(v.toFixed(), 8), v];
    }
    return ['', v];
  }, [
    quoteInfo?.toTokenAmount,
    quoteInfo?.toTokenDecimals,
    receiveToken?.decimals,
  ]);

  const [receivedTokenUsd, isHighPriceDifference] = useMemo(() => {
    if (quoteInfo?.toTokenAmount) {
      const v = receivedTokeAmountBn.times(receiveToken?.price || 0);
      const isHighPrice = v
        .minus(payTokenUsdBn)
        .div(payTokenUsdBn)
        .times(100)
        .lte(-5);

      return [
        `${splitNumberByStep(v.toFixed(2))} (${v
          .minus(payTokenUsdBn)
          .div(payTokenUsdBn)
          .times(100)
          .toFixed(2)}%)`,
        isHighPrice,
      ];
    }
    return ['', false];
  }, [
    quoteInfo?.toTokenAmount,
    receivedTokeAmountBn,
    receiveToken?.price,
    payTokenUsdBn,
  ]);

  const isInsufficient = useMemo(() => {
    return new BigNumber(payAmount || 0).gt(
      new BigNumber(payToken?.raw_amount_hex_str || 0).div(
        10 ** (payToken?.decimals || 0)
      )
    );
  }, [payAmount, payToken?.decimals, payToken?.raw_amount_hex_str]);

  const isStableCoin = useMemo(() => {
    if (payToken?.price && receiveToken?.price) {
      return new BigNumber(payToken?.price)
        .minus(receiveToken?.price)
        .div(payToken?.price)
        .abs()
        .lte(0.01);
    }
    return false;
  }, [payToken, receiveToken]);

  const [, cancel] = useDebounce(() => fetchQuote(), 200, [
    userAddress,
    dexId,
    chain,
    payAmount,
    payToken?.id,
    payToken?.decimals,
    receiveToken?.id,
    feeRate,
    slippage,
    refreshId,
  ]);

  const resetSwapTokens = (c: CHAINS_ENUM) => {
    setPayToken(getChainDefaultToken(c));
    setReceiveToken(undefined);
  };

  const handleChain = (c: CHAINS_ENUM) => {
    saveSelectedChain(c);
    resetSwapTokens(c);
  };

  const onChainChanged = async () => {
    const gasCache = await swapState.getSwapGasCache(chain);
    setGasLevel(
      gasCache
        ? {
            level:
              gasCache.lastTimeSelect === 'gasPrice'
                ? 'custom'
                : gasCache.gasLevel!,
            base_fee: 0,
            price:
              gasCache.lastTimeSelect === 'gasPrice' ? gasCache.gasPrice! : 0,
            front_tx_count: 0,
            estimated_seconds: 0,
          }
        : defaultGasFee
    );
  };

  const handleMax = () => {
    setAmount(
      new BigNumber(payToken?.raw_amount_hex_str || '')
        .div(10 ** (payToken?.decimals || 0))
        .toFixed()
    );
  };

  const switchToken = () => {
    setPayToken(receiveToken);
    setReceiveToken(payToken);
    fetchQuote();
  };

  const canSubmit =
    !!payToken &&
    !!receiveToken &&
    !!chain &&
    !!payAmount &&
    !isInsufficient &&
    !tokenLoading &&
    tokenPass &&
    !loading &&
    !!quoteInfo &&
    isSdkDataPass;

  const tipsDisplay = useMemo(() => {
    if (isInsufficient) {
      return TIPS.insufficient;
    }

    if (
      loading ||
      nativeTokenLoading ||
      tokenLoading ||
      payTokenLoading ||
      totalGasUsedLoading
    ) {
      return null;
    }

    if (payToken && payAmount && receiveToken) {
      if (!loading && !quoteInfo) {
        return TIPS.quoteFail;
      }

      if (!tokenLoading && !payTokenPass) {
        return TIPS.payTokenFail;
      }

      if (!tokenLoading && !receiveTokenPass) {
        return TIPS.receivingTokenFail;
      }

      if (!loading && quoteInfo && !tokenLoading && !isSdkDataPass) {
        return TIPS.securityFail;
      }

      if (!loading && quoteInfo && isHighPriceDifference) {
        return TIPS.priceDifference;
      }
      if (
        chain &&
        quoteInfo &&
        payToken &&
        dexId &&
        gasMarket &&
        !loading &&
        !totalGasUsedLoading &&
        totalGasUsed === undefined
      ) {
        return TIPS.gasCostFail;
      }
      if (
        quoteInfo &&
        (payToken.price === undefined || receiveToken.price === undefined)
      ) {
        return TIPS.priceFail;
      }
    }

    if (Number(slippage) > 10) {
      return TIPS.highSlippage;
    }
    if (Number(slippage) < 0.05) {
      return TIPS.lowSlippage;
    }
    return null;
  }, [
    isInsufficient,
    loading,
    nativeTokenLoading,
    tokenLoading,
    payTokenLoading,
    totalGasUsedLoading,
    payToken,
    payAmount,
    receiveToken,
    slippage,
    quoteInfo,
    payTokenPass,
    receiveTokenPass,
    isSdkDataPass,
    isHighPriceDifference,
    chain,
    dexId,
    gasMarket,
    totalGasUsed,
  ]);

  const refresh = () => {
    setRefreshId((id) => ++id);
  };

  const handleUpdateGasCache = async () => {
    let price = 0;
    if (gasLevel.level === 'custom') {
      price = gasLevel.price;
    } else {
      price = (gasMarket || []).find(
        (item) => item.level === gasLevel.level
      )!.price;
    }
    await swapState.updateSwapGasCache(chain, {
      gasPrice: price,
      gasLevel: gasLevel.level,
      lastTimeSelect: gasLevel.level === 'custom' ? 'gasPrice' : 'gasLevel',
    });
  };

  const gotoSwap = async () => {
    if (canSubmit && lastSelectedDex) {
      let price = 0;
      if (gasLevel.level === 'custom') {
        price = gasLevel.price;
      } else {
        price = (gasMarket || []).find(
          (item) => item.level === gasLevel.level
        )!.price;
      }
      await handleUpdateGasCache();
      try {
        walletController.dexSwap(
          {
            chain,
            quote: quoteInfo,
            needApprove: !tokenApproved,
            // @ts-expect-error
            spender: DEX_SPENDER_WHITELIST[lastSelectedDex][chain],
            pay_token_id: payToken.id,
            gasPrice: price,
            unlimited: !!unlimitedAllowance,
            shouldTwoStepApprove,
          }
          // {
          //   ga: {
          //     category: 'Swap',
          //     source: 'swap',
          //     trigger: rbiSource,
          //   },
          // }
        );
        hideMainwinPopupview('quick-swap');
        window.location.reload();
      } catch (error) {
        console.error(error);
      }
    }
  };

  const handleSwap = async () => {
    if (payAmount && payToken && !receiveToken) {
      // message.error({
      //   className: 'rabbyx-tx-changed-tip',
      //   icon: (
      //     <InfoCircleOutlined
      //       className={clsx(
      //         'pb-2 self-start transform rotate-180 origin-center text-red-light'
      //       )}
      //     />
      //   ),
      //   content: 'Please select receive token',
      // });
      return;
    }
    if (tipsDisplay?.level === 'danger') {
      // message.error({
      //   className: 'rabbyx-tx-changed-tip',
      //   icon: (
      //     <InfoCircleOutlined
      //       className={clsx(
      //         'pb-2 self-start transform rotate-180 origin-center text-red-light'
      //       )}
      //     />
      //   ),
      //   content: tipsDisplay.label,
      // });
      return;
    }

    if (canSubmit && lastSelectedDex) {
      if (shouldTwoStepApprove) {
        return confirm({
          closable: true,
          centered: true,
          className: styles.approvalModal,
          title: null,
          icon: null,
          closeIcon: <IconRcClose />,

          content: (
            <>
              <div className={styles.title}>
                Sign 2 transactions to change allowance
              </div>
              <div className={styles.desc}>
                Token USDT requires 2 transactions to change allowance. First
                you would need to reset allowance to zero, and only then set new
                allowance value.
              </div>
            </>
          ),
          okText: 'Proceed with two step approve',
          onOk() {
            gotoSwap();
          },
        });
      }
      gotoSwap();
    }
  };

  const totalLoading =
    loading ||
    nativeTokenLoading ||
    tokenLoading ||
    payTokenLoading ||
    totalGasUsedLoading;

  useEffect(() => {
    if (isWrapToken) {
      setFeeRate('0');
    } else if (isStableCoin) {
      setFeeRate('0.1');
    } else {
      setFeeRate('0.3');
    }

    if (isStableCoin) {
      setSlippage('0.05');
    }
  }, [isWrapToken, isStableCoin]);

  useEffect(() => {
    if (dexId !== lastSelectedDex && dexId !== DEX_ENUM.WRAPTOKEN) {
      saveSelectedChain(CHAINS_ENUM.ETH);
      resetSwapTokens(CHAINS_ENUM.ETH);
      setDexId(lastSelectedDex);
      setAmount('');
    }
  }, [dexId, lastSelectedDex, saveSelectedChain]);

  useEffect(() => {
    onChainChanged();
  }, [chain]);

  useEffect(() => {
    setChain(lastSelectedChain);
    setPayToken(getChainDefaultToken(lastSelectedChain));
  }, [lastSelectedChain]);

  useEffect(() => {
    return cancel;
  }, []);

  if (!lastSelectedDex) {
    return (
      <div className="bg-gray-bg h-full">
        <DexSelectDrawer visible onClose={() => toggleVisible(false)} />
      </div>
    );
  }

  return (
    <div className={styles.swapBox} ref={domRef}>
      <Header logo={logo} name={name} toggleVisible={toggleVisible} />

      <div className={styles.tokenExchange}>
        <div className={styles.content}>
          <div className={styles.chainSelectBox}>
            <ChainSelect
              value={chain}
              onChange={handleChain}
              disabledTips={
                <span style={{ fontSize: 12 }}>
                  Not supported by the current exchange
                </span>
              }
              title={<>Select the chain supported by {name}</>}
            />
            {!!payAmount && !!payToken && !!receiveToken && (
              <IconRefresh
                className={styles.refresh}
                refresh={refresh}
                start={quickWindowOpen}
              />
            )}
          </div>
          <div className={styles.swapTokenBox}>
            <SwapTokenWrapper>
              <div className={styles.p1}>Pay with</div>
              <TokenSelect
                value={payAmount}
                token={payToken}
                onTokenChange={setPayToken}
                chainId={CHAINS[chain].serverId}
                type="swapFrom"
                onChange={setAmount}
                excludeTokens={
                  receiveToken?.id ? [receiveToken?.id] : undefined
                }
                getContainer={() => domRef.current || document.body}
                forceFocus={quickWindowOpen}
              />
              <div className={styles.p2}>
                {payTokenLoading ? (
                  <Skeleton.Input
                    style={{
                      height: 14,
                    }}
                    active
                  />
                ) : (
                  <div
                    className={clsx(
                      styles.itemsCenter,
                      !payToken && styles.hidden,
                      isInsufficient && styles.isInsufficient
                    )}
                  >
                    <span>
                      Balance:{' '}
                      {splitNumberByStep(
                        new BigNumber(payToken?.amount || 0).toFixed(2, 1)
                      )}
                    </span>
                    {payToken && !payTokenIsNativeToken && (
                      <img
                        className={styles.maxButton}
                        src={ButtonMax}
                        onClick={handleMax}
                      />
                    )}
                  </div>
                )}
                {payTokenLoading ? null : (
                  <div
                    className={clsx((!payToken || !payAmount) && styles.hidden)}
                  >
                    ${splitNumberByStep(payTokenUsdDisplay)}
                  </div>
                )}
              </div>
            </SwapTokenWrapper>
            <SwapTokenWrapper>
              <div className={styles.p1}>Receive</div>
              <TokenSelect
                token={receiveToken}
                onTokenChange={setReceiveToken}
                chainId={CHAINS[chain].serverId}
                type="swapTo"
                excludeTokens={payToken?.id ? [payToken?.id] : undefined}
                value={receivedTokeAmountDisplay}
                loading={loading}
                getContainer={() => domRef.current || document.body}
              />
              <div className={styles.p2}>
                <div className={clsx(!receiveToken && styles.hidden)}>
                  Balance:
                  {splitNumberByStep((receiveToken?.amount || 0).toFixed(2))}
                </div>

                {loading ? (
                  <div
                    style={{
                      width: 86,
                      height: 14,
                      overflow: 'hidden',
                    }}
                  >
                    <Skeleton.Input
                      style={{
                        height: 14,
                      }}
                      active
                    />
                  </div>
                ) : (
                  <div
                    className={clsx(
                      (!receivedTokenUsd || !payAmount) && styles.hidden
                    )}
                  >
                    ${receivedTokenUsd}
                  </div>
                )}
              </div>
            </SwapTokenWrapper>
            <div className={styles.switchBtn} onClick={switchToken}>
              <IconSwitchToken />
            </div>
          </div>
          {payToken && receiveToken && (
            <div className={styles.Slippage}>
              <Slippage
                value={slippage}
                onChange={setSlippage}
                amount={
                  quoteInfo?.toTokenAmount
                    ? receivedTokeAmountBn
                        .minus(receivedTokeAmountBn.times(slippage).div(100))
                        .toFixed(2)
                    : ''
                }
                symbol={receiveToken?.symbol}
              />

              {nativeToken && (
                <GasSelector
                  // chainId={CHAINS[chain].id}
                  onChange={(gas: GasLevel) => {
                    setGasLevel(gas);
                  }}
                  gasList={gasMarket || []}
                  gas={gasLevel}
                  token={nativeToken}
                  gasUsed={totalGasUsed}
                />
              )}

              <Fee fee={feeRate} symbol={wrapTokenSymbol} />
            </div>
          )}
        </div>
        {!!tipsDisplay && (
          <Alert
            className={styles.alert}
            icon={
              <InfoCircleOutlined
                className={clsx(
                  styles.info,
                  tipsDisplay.level === 'danger' && styles.danger
                )}
              />
            }
            banner
            message={
              <span
                className={clsx(
                  styles.message,
                  tipsDisplay.level === 'danger' && styles.danger
                )}
              >
                {tipsDisplay.label}
              </span>
            }
          />
        )}
      </div>

      <DexSelectDrawer visible={visible} onClose={() => toggleVisible(false)} />

      <FooterWrapper>
        {!tokenApproved && (
          <div className="box">
            <div className="tips">
              1.Approve <span className="swapTips">→ 2.Swap</span>
            </div>
            <div className={clsx('allowance', unlimitedAllowance && 'unLimit')}>
              <span>Unlimited allowance</span>{' '}
              <Switch
                size="small"
                checked={unlimitedAllowance}
                onChange={setUnlimited}
              />
            </div>
          </div>
        )}
        <Button
          size="large"
          type="primary"
          onClick={handleSwap}
          className={clsx((!canSubmit || totalLoading) && 'disabled')}
          icon={totalLoading ? <IconLoading className="animate-spin" /> : null}
        >
          {loading
            ? 'Fetching offer'
            : !tokenApproved
            ? `Approve ${payToken?.symbol}`
            : 'Swap'}
        </Button>
      </FooterWrapper>
    </div>
  );
};

export const SwapByDex = memo(Swap);
