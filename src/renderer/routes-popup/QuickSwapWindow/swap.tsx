import { useEffect, useMemo, useState } from 'react';
import { CHAINS, CHAINS_ENUM, formatTokenAmount } from '@debank/common';
// import { useLocation } from 'react-router-dom';

import {
  useAsync,
  useAsyncFn,
  useCss,
  useDebounce,
  useToggle,
} from 'react-use';
import clsx from 'clsx';
import styled from 'styled-components';
import BigNumber from 'bignumber.js';
// import { SwapChainSelector } from '@/ui/component/ChainSelector/tag';
// import TokenSelect from '@/ui/component/TokenSelect';
import { Alert, Button, message, Modal, Skeleton, Switch } from 'antd';
import { InfoCircleFilled } from '@ant-design/icons';

import {
  DEX_ENUM,
  DEX_SPENDER_WHITELIST,
  getQuote,
  WrapTokenAddressMap,
} from '@rabby-wallet/rabby-swap';
import { GasLevel, TokenItem } from '@debank/rabby-api/dist/types';
import { useCurrentAccount } from '@/renderer/hooks/rabbyx/useAccount';
import { useSwap } from '@/renderer/hooks/rabbyx/useSwap';
import { walletController } from '@/renderer/ipcRequest/rabbyx';
import { isSameAddress } from '@/renderer/utils/address';
import { splitNumberByStep } from '@/renderer/utils/number';
import openapi from '@/renderer/utils/openapi';
import { query2obj } from '@/renderer/utils/url';

import ButtonMax from '@/../assets/icons/swap/max.svg';

import IconSwitchDex from '@/../assets/icons/swap/switch.svg?rc';
import IconLoading from '@/../assets/icons/swap/loading.svg?rc';
import IconSwitchToken from '@/../assets/icons/swap/switch-token.svg?rc';

import { DexSelectDrawer } from './component/DexSelect';
import { Fee, FeeProps } from './component/Fee';
import { GasSelector } from './component/GasSelector';
import { IconRefresh } from './component/IconRefresh';
import { useGasAmount, useVerifySdk } from './hooks';
// import { useRbiSource } from '@/ui/utils/ga-event';
// import stats from '@/stats';

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

const { confirm } = Modal;

const SwapTokenWrapper = styled.div`
  /* width: 336px; */
  height: 103px;
  display: flex;
  flex-direction: column;
  padding: 10px 12px 12px 8px;
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
  gap: 20px;
  .box {
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .tips {
    font-weight: 500;
    font-size: 13px;
    line-height: 15px;
    color: #13141a;

    .swapTips {
      color: #707280;
    }
  }

  .allowance {
    display: flex;
    gap: 7px;
    font-style: normal;
    font-weight: 400;
    font-size: 12px;
    line-height: 14px;
    text-align: right;
    color: #707280;
    &.unLimit {
      color: var(--color-paragraph);
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
    background-color: #b6c1ff;
    box-shadow: 0px 12px 24px rgba(134, 151, 255, 0.12);
    border-color: rgba(134, 151, 255, 0.12);
    cursor: not-allowed;
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

export const SwapByDex = () => {
  // const oDexId = useRabbySelector((state) => state.swap.selectedDex);

  const { currentAccount } = useCurrentAccount();
  const userAddress = currentAccount?.address || '';
  const swapState = useSwap();
  const { swap } = swapState;
  const oDexId = swap.selectedDex;
  const oChain = swap.selectedChain || CHAINS_ENUM.ETH;
  const { unlimitedAllowance = false } = swap;
  const dispatch = swapState;

  // const { search } = useLocation();
  const [searchObj] = useState<{
    payTokenId?: string;
    chain?: string;
  }>(query2obj(window.location.search));

  // const rbiSource = useRbiSource();

  // useMemo(() => {
  //   if (rbiSource) {
  //     stats.report('enterSwapDescPage', {
  //       refer: rbiSource,
  //     });
  //   }
  // }, [rbiSource]);

  const [refreshId, setRefreshId] = useState(0);

  const [dexId, setDexId] = useState(() => oDexId);
  // const { userAddress, unlimitedAllowance } = useRabbySelector((state) => ({
  //   userAddress: state.account.currentAccount?.address || '',
  //   unlimitedAllowance: state.swap.unlimitedAllowance || false,
  // }));

  const setUnlimited = (bool: boolean) => {
    dispatch.setUnlimitedAllowance(bool);
  };
  // const wallet = useWallet();

  const [visible, toggleVisible] = useToggle(false);

  const [chain, setChain] = useState(oChain);

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

  useMemo(() => {
    if (searchObj.chain && searchObj.payTokenId) {
      const target = Object.values(CHAINS).find(
        (item) => item.serverId === searchObj.chain
      );
      if (target) {
        setChain(target?.enum);
        setPayToken({
          ...getChainDefaultToken(target?.enum),
          id: searchObj.payTokenId,
        });
      }
    }
  }, [searchObj?.chain, searchObj?.payTokenId]);

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
      setDexId(res ? DEX_ENUM.WRAPTOKEN : oDexId);
      return [
        res,
        // @ts-expect-error
        isSameAddress(payToken?.id, WrapTokenAddressMap[chain])
          ? payToken.symbol
          : receiveToken.symbol,
      ];
    }
    setDexId(oDexId);
    return [false, ''];
  }, [
    payToken?.id,
    payToken?.symbol,
    receiveToken?.id,
    receiveToken?.symbol,
    oDexId,
    chain,
  ]);

  const [logo, name] = useMemo(() => {
    if (oDexId) {
      // @ts-expect-error
      return [DEX[oDexId].logo, DEX[oDexId].name];
    }
    return ['', ''];
  }, [oDexId]);

  const { value: gasMarket } = useAsync(() => {
    return openapi.gasMarket(CHAINS[chain].serverId);
  }, [chain]);

  const { value: nativeToken, loading: nativeTokenLoading } =
    useAsync(async () => {
      if (chain) {
        const t = await openapi.getToken(
          userAddress,
          CHAINS[chain].serverId,
          CHAINS[chain].nativeTokenAddress
        );

        return t;
      }
    }, [chain]);

  const { loading: payTokenLoading } = useAsync(async () => {
    if (payToken?.id && chain && payToken?.time_at === 0) {
      const t = await openapi.getToken(
        userAddress,
        CHAINS[chain].serverId,
        payToken?.id
      );
      setPayToken(t);
    }
  }, [chain, payToken?.id, payToken?.time_at, refreshId]);

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
    // stats.report('swapRequestQuote', {
    //   dex: dexId,
    //   chain,
    //   fromToken: payToken.id,
    //   toToken: receiveToken.id,
    // });
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

      // stats.report('swapQuoteResult', {
      //   dex: dexId,
      //   chain,
      //   fromToken: payToken.id,
      //   toToken: receiveToken.id,
      //   status: data ? 'success' : 'fail',
      // });

      return data;
    } catch (error) {
      // stats.report('swapQuoteResult', {
      //   dex: dexId,
      //   chain,
      //   fromToken: payToken.id,
      //   toToken: receiveToken.id,
      //   status: 'fail',
      // });
    }
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
      receiveToken && {
        ...quoteInfo,
        fromToken: payToken!.id,
        fromTokenAmount: new BigNumber(payAmount)
          .times(10 ** payToken!.decimals)
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
    setChain(c);
    dispatch.setLastSelectedSwapChain(c);
    resetSwapTokens(c);
  };

  const onChainChanged = async () => {
    const gasCache = await dispatch.getLastTimeGasSelection(chain);
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
  }, [
    isInsufficient,
    payToken,
    payAmount,
    receiveToken,
    loading,
    quoteInfo,
    tokenLoading,
    payTokenPass,
    receiveTokenPass,
    isSdkDataPass,
    isHighPriceDifference,
    chain,
    dexId,
    gasMarket,
    totalGasUsedLoading,
    totalGasUsed,
    slippage,
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
    await dispatch.updateSwapGasCache(chain, {
      gasPrice: price,
      gasLevel: gasLevel.level,
      lastTimeSelect: gasLevel.level === 'custom' ? 'gasPrice' : 'gasLevel',
    });
  };

  const gotoSwap = async () => {
    if (canSubmit && oDexId) {
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
            spender: DEX_SPENDER_WHITELIST[oDexId][chain],
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
        window.close();
      } catch (error) {
        console.error(error);
      }
    }
  };

  const twoStepApproveCn = useCss({
    '& .ant-modal-content': {
      background: '#fff',
    },
    '& .ant-modal-body': {
      padding: '12px 8px 32px 16px',
    },
    '& .ant-modal-confirm-content': {
      padding: '4px 0 0 0',
    },
    '& .ant-modal-confirm-btns': {
      justifyContent: 'center',
      '.ant-btn-primary': {
        width: '260px',
        height: '40px',
      },
      'button:first-child': {
        display: 'none',
      },
    },
  });
  const handleSwap = async () => {
    if (payAmount && payToken && !receiveToken) {
      message.error({
        icon: (
          <InfoCircleFilled
            className={clsx(
              'pb-2 self-start transform rotate-180 origin-center text-red-light'
            )}
          />
        ),
        content: 'Please select receive token',
      });
      return;
    }
    if (tipsDisplay?.level === 'danger') {
      message.error({
        icon: (
          <InfoCircleFilled
            className={clsx(
              'pb-2 self-start transform rotate-180 origin-center text-red-light'
            )}
          />
        ),
        content: tipsDisplay.label,
      });
      return;
    }

    if (canSubmit && oDexId) {
      if (shouldTwoStepApprove) {
        return confirm({
          width: 360,
          closable: true,
          centered: true,
          className: twoStepApproveCn,
          title: null,
          content: (
            <>
              <div className="text-[16px] font-medium text-gray-title mb-18 text-center">
                Sign 2 transactions to change allowance
              </div>
              <div className="text-13 leading-[17px]  text-gray-subTitle">
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
    if (dexId !== oDexId && dexId !== DEX_ENUM.WRAPTOKEN) {
      setChain(CHAINS_ENUM.ETH);
      resetSwapTokens(CHAINS_ENUM.ETH);
      setDexId(oDexId);
      setAmount('');
    }
  }, [dexId, oDexId]);

  useEffect(() => {
    onChainChanged();
  }, [chain]);

  useEffect(() => {
    return cancel;
  }, []);

  if (!oDexId) {
    return (
      <div className="bg-gray-bg h-full">
        <DexSelectDrawer visible onClose={() => toggleVisible(false)} />
      </div>
    );
  }

  return (
    <div className={styles.swapBox}>
      <Header logo={logo} name={name} toggleVisible={toggleVisible} />

      <div className={styles.tokenExchange}>
        <div className={styles.content}>
          <div className={styles.chainSelectBox}>
            <ChainSelect
              value={chain}
              onChange={handleChain}
              disabledTips="Not supported by the current exchange"
              title={<>Select the chain supported by {name}</>}
            />
            {!!payAmount && !!payToken && !!receiveToken && (
              <IconRefresh className={styles.refresh} refresh={refresh} />
            )}
          </div>
          <div className={styles.swapTokenBox}>
            <SwapTokenWrapper>
              <div className={styles.p1}>Pay with</div>
              {/* <TokenSelect
                value={payAmount}
                token={payToken}
                onTokenChange={setPayToken}
                chainId={CHAINS[chain].serverId}
                type={'swapFrom'}
                placeholder={'Search by Name / Address'}
                onChange={setAmount}
                excludeTokens={
                  receiveToken?.id ? [receiveToken?.id] : undefined
                }
              /> */}
              <div className={styles.p2}>
                {payTokenLoading ? (
                  <Skeleton.Input
                    style={{
                      width: 86,
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
                    Balance:{' '}
                    {splitNumberByStep(
                      new BigNumber(payToken?.amount || 0).toFixed(2, 1)
                    )}
                    {payToken && !payTokenIsNativeToken && (
                      <img
                        className={styles.maxButton}
                        src={ButtonMax}
                        onClick={handleMax}
                      />
                    )}
                  </div>
                )}
                {payTokenLoading ? (
                  <Skeleton.Input
                    style={{
                      width: 86,
                      height: 14,
                    }}
                    active
                  />
                ) : (
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
              {/* <TokenSelect
                token={receiveToken}
                onTokenChange={setReceiveToken}
                chainId={CHAINS[chain].serverId}
                type="swapTo"
                placeholder="Search by Name / Address"
                excludeTokens={payToken?.id ? [payToken?.id] : undefined}
                value={receivedTokeAmountDisplay}
                loading={loading}
              /> */}
              <div className={styles.p2}>
                <div className={clsx(!receiveToken && styles.hidden)}>
                  Balance:
                  {splitNumberByStep((receiveToken?.amount || 0).toFixed(2))}
                </div>

                {loading ? (
                  <Skeleton.Input
                    style={{
                      width: 86,
                      height: 14,
                    }}
                    active
                  />
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
              <InfoCircleFilled
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
              <Switch checked={unlimitedAllowance} onChange={setUnlimited} />
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
