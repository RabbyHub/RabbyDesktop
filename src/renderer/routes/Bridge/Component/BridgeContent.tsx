import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Button, message, Modal } from 'antd';
import BigNumber from 'bignumber.js';
import clsx from 'clsx';
import { useTranslation } from 'react-i18next';

import pRetry from 'p-retry';
import { useMemoizedFn } from 'ahooks';
import RcIconWarningCC from '@/../assets/icons/common/warning-cc.svg?rc';
import IconRcClose from '@/../assets/icons/swap/close.svg?rc';
import { useCurrentAccount } from '@/renderer/hooks/rabbyx/useAccount';
import { stats } from '@/isomorphic/stats';
import { walletController, walletOpenapi } from '@/renderer/ipcRequest/rabbyx';
import { useRbiSource } from '@/renderer/hooks/useRbiSource';
import { findChainByEnum } from '@/renderer/utils';
import styled from 'styled-components';
import {
  useBridge,
  useQuoteVisible,
  useRefreshBridgeHistory,
  useSetQuoteVisible,
  useSetRefreshId,
} from '../hooks';
import { QuoteList } from './BridgeQuotes';
import { BridgeToken } from './BridgeToken';
import { BridgeSwitchBtn } from './BridgeSwitchButton';
import { BridgeShowMore, RecommendFromToken } from './BridgeShowMore';
import { BridgeTxHistory } from './BridgeHistory';
import styles from '../../Swap/index.module.less';
import { useOnTxFinished } from '../../Swap/hooks/subscribe';

const StyledBridgeBox = styled.div`
  position: relative;
  width: 528px;
  min-height: 640px;
  display: flex;
  flex-direction: column;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  padding: 20px;
  margin: 0 auto;
  background: rgba(0, 0, 0, 0.1);

  .divide {
    position: absolute;
    bottom: 104px;
    left: 0;
    width: 100%;
    height: 1px;
    background: rgba(255, 255, 255, 0.2);
  }
`;

export const BridgeContent = () => {
  const { currentAccount } = useCurrentAccount();
  const userAddress = currentAccount?.address;

  const {
    fromChain,
    fromToken,
    setFromToken,
    switchFromChain,
    toChain,
    toToken,
    setToToken,
    switchToChain: setToChain,
    switchToken,
    amount,
    handleAmountChange,

    recommendFromToken,
    fillRecommendFromToken,

    inSufficient,

    openQuotesList,
    quoteLoading,
    quoteList,

    bestQuoteId,
    selectedBridgeQuote,

    setSelectedBridgeQuote,

    slippage,
    slippageState,
    setSlippage,
    setSlippageChanged,
    isSlippageHigh,
    isSlippageLow,

    autoSlippage,
    isCustomSlippage,
    setAutoSlippage,
    setIsCustomSlippage,

    clearExpiredTimer,
  } = useBridge();

  useEffect(() => {
    if (currentAccount?.address) {
      handleAmountChange('');
    }
  }, [currentAccount?.address, handleAmountChange]);

  const amountAvailable = useMemo(() => Number(amount) > 0, [amount]);

  const visible = useQuoteVisible();

  const setVisible = useSetQuoteVisible();

  const refresh = useSetRefreshId();

  const { t } = useTranslation();

  const btnText = useMemo(() => {
    if (selectedBridgeQuote?.shouldApproveToken) {
      return t('page.bridge.approve-and-bridge');
    }
    return t('page.bridge.title');
  }, [selectedBridgeQuote?.shouldApproveToken, t]);

  const wallet = walletController;
  const rbiSource = useRbiSource();

  const [fetchingBridgeQuote, setFetchingBridgeQuote] = useState(false);

  const [, refreshBridgeHistory] = useRefreshBridgeHistory();

  const setRefreshId = useSetRefreshId();

  // const [lastestTx, setLastestTx] = useState<BridgeQuote['tx']>();
  const latestTxRef = useRef<string>();

  const refreshOnCompelete = useMemoizedFn(
    (payload: { success: boolean; hash: string }) => {
      if (
        latestTxRef?.current &&
        payload.success &&
        payload.hash?.toLowerCase() === latestTxRef.current?.toLowerCase()
      ) {
        refreshBridgeHistory((e) => e + 1);
        setRefreshId((e) => e + 1);
      }
    }
  );
  useOnTxFinished(refreshOnCompelete);

  const [isShowSign, setIsShowSign] = useState(false);
  const gotoBridge = useCallback(async () => {
    if (
      !inSufficient &&
      fromToken &&
      toToken &&
      selectedBridgeQuote?.bridge_id
    ) {
      try {
        setFetchingBridgeQuote(true);
        const { tx } = await pRetry(
          () =>
            walletOpenapi.getBridgeQuoteTxV2({
              aggregator_id: selectedBridgeQuote.aggregator.id,
              bridge_id: selectedBridgeQuote.bridge_id,
              from_token_id: fromToken.id,
              user_addr: userAddress!,
              from_chain_id: fromToken.chain,
              from_token_raw_amount: new BigNumber(amount)
                .times(10 ** fromToken.decimals)
                .toFixed(0, 1)
                .toString(),
              to_chain_id: toToken.chain,
              to_token_id: toToken.id,
              slippage: new BigNumber(slippageState).div(100).toString(10),
            }),
          { retries: 3 }
        );
        stats.report('bridgeQuoteResult', {
          aggregatorIds: selectedBridgeQuote.aggregator.id,
          bridgeId: selectedBridgeQuote.bridge_id,
          fromChainId: fromToken.chain,
          fromTokenId: fromToken.id,
          toTokenId: toToken.id,
          toChainId: toToken.chain,
          status: tx ? 'success' : 'fail',
        });
        clearExpiredTimer();
        const txs = await wallet.bridgeToken(
          {
            to: tx.to,
            value: tx.value,
            data: tx.data,
            payTokenRawAmount: new BigNumber(amount)
              .times(10 ** fromToken.decimals)
              .toFixed(0, 1)
              .toString(),
            chainId: tx.chainId,
            shouldApprove: !!selectedBridgeQuote.shouldApproveToken,
            shouldTwoStepApprove: !!selectedBridgeQuote.shouldTwoStepApprove,
            payTokenId: fromToken.id,
            payTokenChainServerId: fromToken.chain,
            info: {
              aggregator_id: selectedBridgeQuote.aggregator.id,
              bridge_id: selectedBridgeQuote.bridge_id,
              from_chain_id: fromToken.chain,
              from_token_id: fromToken.id,
              from_token_amount: amount,
              to_chain_id: toToken.chain,
              to_token_id: toToken.id,
              to_token_amount: selectedBridgeQuote.to_token_amount,
              tx,
              rabby_fee: selectedBridgeQuote.rabby_fee.usd_value,
            },
          },
          {
            ga: {
              category: 'Bridge',
              source: 'bridge',
              trigger: rbiSource,
            },
          }
        );

        let completeSignSteps = 1;
        if (selectedBridgeQuote.shouldTwoStepApprove) {
          completeSignSteps = 3;
        }
        if (
          selectedBridgeQuote.shouldApproveToken &&
          !selectedBridgeQuote.shouldTwoStepApprove
        ) {
          completeSignSteps = 2;
        }

        if (txs && txs.length === completeSignSteps) {
          handleAmountChange('');
          refreshBridgeHistory((e) => e + 1);
          latestTxRef.current = txs[txs.length - 1];
        }
      } catch (error) {
        // @ts-ignore
        message.error(error?.message || String(error));
        stats.report('bridgeQuoteResult', {
          aggregatorIds: selectedBridgeQuote.aggregator.id,
          bridgeId: selectedBridgeQuote.bridge_id,
          fromChainId: fromToken.chain,
          fromTokenId: fromToken.id,
          toTokenId: toToken.id,
          toChainId: toToken.chain,
          status: 'fail',
        });
        console.error(error);
      } finally {
        setFetchingBridgeQuote(false);
        setRefreshId((e) => e + 1);
      }
    }
  }, [
    clearExpiredTimer,
    inSufficient,
    fromToken,
    toToken,
    selectedBridgeQuote?.bridge_id,
    selectedBridgeQuote?.aggregator.id,
    selectedBridgeQuote?.shouldApproveToken,
    selectedBridgeQuote?.shouldTwoStepApprove,
    selectedBridgeQuote?.to_token_amount,
    selectedBridgeQuote?.rabby_fee.usd_value,
    wallet,
    amount,
    rbiSource,
    userAddress,
    slippageState,
    handleAmountChange,
    refreshBridgeHistory,
    setRefreshId,
  ]);

  const buildTxs = useMemoizedFn(async () => {
    if (
      !inSufficient &&
      fromToken &&
      toToken &&
      selectedBridgeQuote?.bridge_id
    ) {
      try {
        setFetchingBridgeQuote(true);
        const { tx } = await pRetry(
          () =>
            walletOpenapi.getBridgeQuoteTxV2({
              aggregator_id: selectedBridgeQuote.aggregator.id,
              bridge_id: selectedBridgeQuote.bridge_id,
              from_chain_id: fromToken.chain,
              from_token_id: fromToken.id,
              user_addr: userAddress!,
              from_token_raw_amount: new BigNumber(amount)
                .times(10 ** fromToken.decimals)
                .toFixed(0, 1)
                .toString(),
              to_chain_id: toToken.chain,
              to_token_id: toToken.id,
              slippage: new BigNumber(slippageState).div(100).toString(10),
            }),
          { retries: 1 }
        );
        stats.report('bridgeQuoteResult', {
          aggregatorIds: selectedBridgeQuote.aggregator.id,
          bridgeId: selectedBridgeQuote.bridge_id,
          fromChainId: fromToken.chain,
          fromTokenId: fromToken.id,
          toTokenId: toToken.id,
          toChainId: toToken.chain,
          status: tx ? 'success' : 'fail',
        });
        return await wallet.buildBridgeToken(
          {
            to: tx.to,
            value: tx.value,
            data: tx.data,
            payTokenRawAmount: new BigNumber(amount)
              .times(10 ** fromToken.decimals)
              .toFixed(0, 1)
              .toString(),
            chainId: tx.chainId,
            shouldApprove: !!selectedBridgeQuote.shouldApproveToken,
            shouldTwoStepApprove: !!selectedBridgeQuote.shouldTwoStepApprove,
            payTokenId: fromToken.id,
            payTokenChainServerId: fromToken.chain,
            info: {
              aggregator_id: selectedBridgeQuote.aggregator.id,
              bridge_id: selectedBridgeQuote.bridge_id,
              from_chain_id: fromToken.chain,
              from_token_id: fromToken.id,
              from_token_amount: amount,
              to_chain_id: toToken.chain,
              to_token_id: toToken.id,
              to_token_amount: selectedBridgeQuote.to_token_amount,
              tx,
              rabby_fee: selectedBridgeQuote.rabby_fee.usd_value,
            },
          },
          {
            ga: {
              category: 'Bridge',
              source: 'bridge',
              trigger: rbiSource,
            },
          }
        );
      } catch (error) {
        // @ts-ignore
        message.error(error?.message || String(error));
        stats.report('bridgeQuoteResult', {
          aggregatorIds: selectedBridgeQuote.aggregator.id,
          bridgeId: selectedBridgeQuote.bridge_id,
          fromChainId: fromToken.chain,
          fromTokenId: fromToken.id,
          toTokenId: toToken.id,
          toChainId: toToken.chain,
          status: 'fail',
        });
        console.error(error);
      } finally {
        setFetchingBridgeQuote(false);
      }
    }
  });

  // const {
  //   data: txs,
  //   runAsync: runBuildSwapTxs,
  //   mutate: mutateTxs,
  // } = useRequest(buildTxs, {
  //   manual: true,
  // });

  const handleBridge = useMemoizedFn(async () => {
    // if (
    //   !toToken?.low_credit_score &&
    //   [
    //     KEYRING_TYPE.SimpleKeyring,
    //     KEYRING_TYPE.HdKeyring,
    //     KEYRING_CLASS.HARDWARE.LEDGER,
    //   ].includes((currentAccount?.type || '') as any)
    // ) {
    //   await runBuildSwapTxs();
    //   setIsShowSign(true);
    //   clearExpiredTimer();
    // } else {
    gotoBridge();
    // }
  });

  const noQuote =
    !inSufficient &&
    !!fromToken &&
    !!toToken &&
    Number(amount) > 0 &&
    !quoteLoading &&
    !quoteList?.length;

  const btnDisabled =
    inSufficient ||
    !fromToken ||
    !toToken ||
    !amountAvailable ||
    !selectedBridgeQuote ||
    quoteLoading ||
    !quoteList?.length;

  const [showMoreOpen, setShowMoreOpen] = useState(false);
  const [openSlippage, setOpenSlippage] = useState(false);

  return (
    <div className="max-w-[1080px] mx-auto mt-[32px]">
      <StyledBridgeBox>
        <div className="relative flex flex-col gap-8">
          <BridgeToken
            type="from"
            chain={fromChain}
            token={fromToken}
            onChangeToken={setFromToken}
            onChangeChain={switchFromChain}
            value={amount}
            onInputChange={handleAmountChange}
            excludeChains={toChain ? [toChain] : undefined}
          />
          <BridgeToken
            type="to"
            chain={toChain}
            token={toToken}
            onChangeToken={setToToken}
            onChangeChain={setToChain}
            fromChainId={
              fromToken?.chain || findChainByEnum(fromChain)?.serverId
            }
            fromTokenId={fromToken?.id}
            valueLoading={quoteLoading}
            value={selectedBridgeQuote?.to_token_amount}
            excludeChains={fromChain ? [fromChain] : undefined}
            noQuote={noQuote}
          />
          <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <BridgeSwitchBtn onClick={switchToken} />
          </div>
        </div>

        <div className="mx-16">
          {selectedBridgeQuote && (
            <BridgeShowMore
              open={showMoreOpen}
              setOpen={setShowMoreOpen}
              openSlippage={openSlippage}
              setOpenSlippage={setOpenSlippage}
              sourceName={selectedBridgeQuote?.aggregator.name || ''}
              sourceLogo={selectedBridgeQuote?.aggregator.logo_url || ''}
              slippage={slippageState}
              displaySlippage={slippage}
              onSlippageChange={(e) => {
                setSlippageChanged(true);
                setSlippage(e);
              }}
              fromToken={fromToken}
              toToken={toToken}
              amount={amount || 0}
              toAmount={selectedBridgeQuote?.to_token_amount}
              openQuotesList={openQuotesList}
              quoteLoading={quoteLoading}
              slippageError={isSlippageHigh || isSlippageLow}
              autoSlippage={autoSlippage}
              isCustomSlippage={isCustomSlippage}
              setAutoSlippage={setAutoSlippage}
              setIsCustomSlippage={setIsCustomSlippage}
            />
          )}
        </div>

        {noQuote && recommendFromToken && (
          <RecommendFromToken
            token={recommendFromToken}
            className="mt-16"
            onOk={fillRecommendFromToken}
          />
        )}

        {inSufficient || (noQuote && !recommendFromToken) ? (
          <Alert
            className={clsx('rounded-[4px] px-0 py-[3px] bg-transparent mt-6')}
            icon={
              <RcIconWarningCC
                viewBox="0 0 16 16"
                className={clsx('mr-4 w-16 h-16', 'text-red-forbidden')}
              />
            }
            banner
            message={
              <span
                className={clsx(
                  'text-13 font-medium',
                  'text-rabby-red-default'
                )}
              >
                {inSufficient
                  ? t('page.bridge.insufficient-balance')
                  : t('page.bridge.no-quote-found')}
              </span>
            }
          />
        ) : null}

        <div
          className={clsx(
            'w-full mt-auto flex flex-col items-center justify-center p-4 gap-12'
          )}
        >
          <div className="divide" />
          <Button
            loading={fetchingBridgeQuote}
            type="primary"
            block
            size="large"
            className="h-[56px] text-white text-[18px] font-medium rounded-[6px]"
            onClick={() => {
              if (fetchingBridgeQuote) return;
              if (!selectedBridgeQuote) {
                refresh((e) => e + 1);

                return;
              }
              if (selectedBridgeQuote?.shouldTwoStepApprove) {
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
                        When swapping USDT, two transactions are required to
                        update the allowance. You will need to reset the
                        allowance to zero before setting a new allowance value.
                      </div>
                    </>
                  ),
                  okText: 'Proceed with Two-Step Approval',
                  onOk() {
                    handleBridge();
                  },
                });
              }
              handleBridge();
            }}
            disabled={btnDisabled}
          >
            {btnText}
          </Button>
        </div>
        {fromToken && toToken ? (
          <QuoteList
            list={quoteList}
            loading={quoteLoading}
            visible={visible}
            onClose={() => {
              setVisible(false);
            }}
            userAddress={userAddress!}
            payToken={fromToken}
            payAmount={amount}
            receiveToken={toToken}
            inSufficient={inSufficient}
            setSelectedBridgeQuote={setSelectedBridgeQuote}
          />
        ) : null}
        {/* <MiniApproval
        visible={isShowSign}
        ga={{
          category: 'Bridge',
          source: 'bridge',
          trigger: rbiSource,
        }}
        txs={txs}
        onClose={() => {
          setIsShowSign(false);
          refresh((e) => e + 1);
          setTimeout(() => {
            mutateTxs([]);
          }, 500);
        }}
        onReject={() => {
          setIsShowSign(false);
          refresh((e) => e + 1);
          mutateTxs([]);
        }}
        onResolve={() => {
          setTimeout(() => {
            setIsShowSign(false);
            mutateTxs([]);
            // setPayAmount('');
            // setTimeout(() => {
            history.replace('/');
            // }, 500);
          }, 500);
        }}
      /> */}
      </StyledBridgeBox>

      <BridgeTxHistory key={currentAccount?.address} />
    </div>
  );
};
