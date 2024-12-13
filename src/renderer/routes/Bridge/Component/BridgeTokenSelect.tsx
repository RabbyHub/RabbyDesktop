import {
  ComponentProps,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { Skeleton } from 'antd';
import { TokenItem } from '@rabby-wallet/rabby-api/dist/types';
import { useAsync } from 'react-use';
import { walletController, walletOpenapi } from '@/renderer/ipcRequest/rabbyx';
import { useCurrentAccount } from '@/renderer/hooks/rabbyx/useAccount';
import BigNumber from 'bignumber.js';
import { useTranslation } from 'react-i18next';
import { TooltipWithMagnetArrow } from '@/renderer/components/Tooltip/TooltipWithMagnetArrow';
import RcIconInfoCC from '@/../assets/icons/common/info-cc.svg?rc';
import RcIconMatchCC from '@/../assets/icons/common/match-cc.svg?rc';

import TokenWithChain from '@/renderer/components/TokenWithChain';
import { getTokenSymbol } from '@/renderer/utils';
import { findChainByServerID } from '@/renderer/utils/chain';
import clsx from 'clsx';

import { formatTokenAmount, formatUsdValue } from '@/renderer/utils/number';
import { TokenSelectModal } from '../../Swap/component/TokenSelect';
import { TokenRender } from '../../Swap/component/TokenRender';

const FromColumn = () => {
  const { t } = useTranslation();
  return (
    <div className="w-full flex items-center justify-between text-12 text-r-neutral-foot">
      <div>{t('component.TokenSelector.bridge.token')}</div>
      <div>{t('component.TokenSelector.bridge.value')}</div>
    </div>
  );
};

const ToColumn = () => {
  const { t } = useTranslation();
  return (
    <div className="w-full flex items-center justify-between text-12 text-r-neutral-foot">
      <div>{t('component.TokenSelector.bridge.token')}</div>
      <div className="flex items-center justify-end relative">
        <span>{t('component.TokenSelector.bridge.liquidity')}</span>
        <TooltipWithMagnetArrow
          placement="top"
          className="rectangle w-[max-content]"
          title={t('component.TokenSelector.bridge.liquidityTips')}
        >
          <RcIconInfoCC className="w-12 h-12 ml-2" viewBox="0 0 14 14" />
        </TooltipWithMagnetArrow>
      </div>{' '}
    </div>
  );
};

const Loading = () => (
  <div className="flex justify-between items-center py-10 pl-[20px] pr-[17px]">
    <div className="gap-x-12 flex">
      <Skeleton.Input
        active
        className="rounded-full w-[24px] h-[24px] bg-r-neutral-bg-1"
      />
      <div className="gap-y-2 flex flex-col">
        <Skeleton.Input
          active
          className="bg-r-neutral-bg-1 rounded-[2px] w-[72px] h-[15px]"
        />
        <Skeleton.Input
          active
          className="bg-r-neutral-bg-1 rounded-[2px] w-[44px] h-[10px]"
        />
      </div>
    </div>
    <div />
    <div>
      <Skeleton.Input
        active
        className="bg-r-neutral-bg-1 rounded-[2px] w-[72px] h-[20px]"
      />
    </div>
  </div>
);

const loadingRender = () => Array.from({ length: 10 }, () => <Loading />);

const Empty = () => {
  const { t } = useTranslation();

  return (
    <div className="mt-[120px] mx-auto flex flex-col items-center">
      <RcIconMatchCC
        className="w-[32px] h-[32px] text-r-neutral-foot"
        viewBox="0 0 33 32"
      />

      <p className="text-r-neutral-foot text-14 mt-8 text-center mb-0">
        {t('component.TokenSelector.noTokens')}
      </p>
    </div>
  );
};

const BridgeTokenItem = ({
  token,
  onChange,
  type,
}: {
  token: TokenItem;
  onChange: (token: TokenItem) => void;
  type?: 'from' | 'to';
}) => {
  const toToken = token as TokenItem & { trade_volume_level: string };
  const { t } = useTranslation();

  const insufficient = useMemo(() => {
    if (type === 'from') {
      return token.amount <= 0;
    }
    return false;
  }, [type, token]);

  const handleChange = () => {
    if (!insufficient) {
      onChange(token);
    }
  };

  return (
    <TooltipWithMagnetArrow
      open={insufficient ? undefined : false}
      title={t('page.bridge.insufficient-balance')}
      align={{ targetOffset: [0, -30] }}
    >
      <div
        className={clsx(
          'flex items-center justify-between h-[56px] border border-solid border-transparent px-20',
          'rounded-[6px] ',
          insufficient
            ? 'opacity-50'
            : 'cursor-pointer hover:border-rabby-blue-default hover:bg-r-blue-light1'
        )}
        onClick={handleChange}
      >
        <div className="flex items-center gap-12 ">
          <TokenWithChain
            token={toToken}
            width="28px"
            height="28px"
            chainIconPosition="tr"
            hideConer
            chainSize={16}
          />
          <div className="flex flex-col gap-1">
            <span className="symbol text-14 text-r-neutral-title-1 font-medium">
              {getTokenSymbol(toToken)}
            </span>
            <span className="symbol text-13 font-normal text-r-neutral-foot">
              {findChainByServerID(toToken.chain)?.name || ''}
            </span>
          </div>
        </div>

        <div className="flex flex-col " />

        <div className="flex flex-col text-right items-end">
          <div
            className={clsx(
              type === 'to' && 'hidden',
              'flex flex-col text-right'
            )}
          >
            <div className="text-14 text-r-neutral-title-1 font-medium">
              {formatTokenAmount(token.amount)}
            </div>
            <div className="text-13 text-r-neutral-foot">
              {formatUsdValue(
                new BigNumber(token.amount).times(token.price).toString(10)
              )}
            </div>
          </div>
          <div
            className={clsx(
              type === 'from' && 'hidden',
              'flex items-center justify-center gap-4',
              'py-2 px-8 rounded-full',
              'text-13 font-normal',
              toToken.trade_volume_level === 'high'
                ? 'bg-r-green-light'
                : 'bg-r-orange-light',
              toToken.trade_volume_level === 'high'
                ? 'text-r-green-default'
                : 'text-r-orange-default'
            )}
          >
            <div
              className={clsx(
                'w-[3px] h-[3px] rounded-full',
                toToken.trade_volume_level === 'high'
                  ? 'bg-r-green-default'
                  : 'bg-r-orange-default'
              )}
            />
            <span>
              {toToken?.trade_volume_level === 'high'
                ? t('component.TokenSelector.bridge.high')
                : t('component.TokenSelector.bridge.low')}
            </span>
          </div>
        </div>
      </div>
    </TooltipWithMagnetArrow>
  );
};

const sortTokensByPrice = (t: TokenItem[]) => {
  return [...t].sort((a, b) => {
    return new BigNumber(b.amount)
      .times(new BigNumber(b.price || 0))
      .minus(new BigNumber(a.amount).times(new BigNumber(a.price || 0)))
      .toNumber();
  });
};

type BridgeTokenSelectProps = {
  type: 'from' | 'to';
  token?: TokenItem;
  onChangeToken: (token: TokenItem) => void;
  chainServerId?: string;
  fromChainId?: string;
  fromTokenId?: string;
};
export const BridgeTokenSelect = (props: BridgeTokenSelectProps) => {
  const {
    type,
    token,
    onChangeToken,
    chainServerId,
    fromChainId,
    fromTokenId,
  } = props;
  const [open, setOpen] = useState(false);
  const [keyword, setKeyword] = useState('');

  const { currentAccount } = useCurrentAccount();

  const { value: allTokens, loading } = useAsync(async () => {
    if (!open || !currentAccount?.address) return [];

    let tokens: TokenItem[] = [];

    if (type === 'from') {
      const defaultTokens = await walletOpenapi.listToken(
        currentAccount!.address,
        chainServerId
      );

      let localAddedTokens: TokenItem[] = [];
      const localAdded =
        (await walletController.getCustomizedToken()).filter((item) => {
          return item.chain === chainServerId;
        }) || [];

      if (localAdded.length > 0) {
        localAddedTokens = await walletOpenapi.customListToken(
          localAdded.map((item) => `${item.chain}:${item.address}`),
          currentAccount?.address
        );
      }

      tokens = sortTokensByPrice([...defaultTokens, ...localAddedTokens]);

      return tokens;
    }
    if (type === 'to' && fromChainId && fromTokenId && chainServerId) {
      const list = await walletOpenapi.getBridgeToTokenList({
        from_chain_id: fromChainId,
        from_token_id: fromTokenId,
        to_chain_id: chainServerId,
        q: keyword,
      });
      return list?.token_list;
    }

    return [];
  }, [open, keyword, type, chainServerId]);

  const { value: displayTokens, loading: displayLoading } =
    useAsync(async () => {
      if (type === 'from' && currentAccount?.address) {
        const kw = keyword.trim();
        if (kw.length === 42 && kw.toLowerCase().startsWith('0x')) {
          const data = await walletOpenapi.searchToken(
            currentAccount.address,
            kw
          );
          return data.filter((e) => e.chain === chainServerId);
        }
        return allTokens?.filter((t) => {
          const reg = new RegExp(kw, 'i');
          return reg.test(t.name) || reg.test(t.symbol);
        });
      }
      return allTokens;
    }, [keyword, allTokens, chainServerId]);

  const columnRender = useCallback(() => {
    if (type === 'from') {
      return <FromColumn />;
    }
    return <ToColumn />;
  }, [type]);

  const tokenRender = useCallback(
    (t: TokenItem, handle: (item: TokenItem) => void) => {
      return (
        <BridgeTokenItem
          token={t}
          onChange={(item) => {
            handle(item);
            setOpen(false);
          }}
          type={type}
        />
      );
    },
    [type]
  );

  const emptyRender = useCallback(() => {
    return <Empty />;
  }, []);

  const bodyStyle = useMemo(
    () => ({
      padding: 20,
      paddingBottom: 0,
    }),
    []
  );

  const onClose = useCallback(() => setOpen(false), []);

  const onSearch: ComponentProps<typeof TokenSelectModal>['onSearch'] =
    useCallback((c) => {
      setKeyword(c.keyword);
    }, []);

  useEffect(() => {
    if (!open) {
      setKeyword('');
    }
  }, [open]);

  return (
    <>
      <TokenRender
        token={token}
        openTokenModal={() => {
          if (chainServerId) {
            setOpen(true);
          }
        }}
        type="bridge"
      />
      {chainServerId && (
        <TokenSelectModal
          open={open}
          list={displayTokens || []}
          onClose={onClose}
          onSearch={onSearch}
          onConfirm={onChangeToken}
          chainServerId={chainServerId}
          isLoading={loading || displayLoading}
          showChainFilter={false}
          columnClassName="flex items-center"
          columnRender={columnRender}
          loadingRender={loadingRender}
          itemRender={tokenRender}
          emptyRender={emptyRender}
          width={400}
          listClassName="-mx-[20px] px-0"
          bodyStyle={bodyStyle}
        />
      )}
    </>
  );
};
