import { TokenItem, TxHistoryResult } from '@rabby-wallet/rabby-api/dist/types';
import { Button, Tooltip } from 'antd';
import {
  useCallback,
  useMemo,
  useState,
  memo,
  DetailedHTMLProps,
  useRef,
} from 'react';
import clsx from 'clsx';
import styled from 'styled-components';
import { DEX_SUPPORT_CHAINS } from '@rabby-wallet/rabby-swap';
import { useNavigate } from 'react-router-dom';
import { atom, useAtomValue, useSetAtom } from 'jotai';
import { IconLink } from '@/../assets/icons/mainwin-settings';
import { Modal } from '@/renderer/components/Modal/Modal';
import { ellipsis } from '@/renderer/utils/address';
import { openExternalUrl } from '@/renderer/ipcRequest/app';
import IconReceive from '@/../assets/icons/home-widgets/receive.svg';
import IconSend from '@/../assets/icons/home-widgets/send.svg';
import IconSwap from '@/../assets/icons/home-widgets/swap.svg';
import { obj2query } from '@/renderer/utils/url';
import { getChain, getTokenSymbol } from '@/renderer/utils';
import { ReceiveModal } from '@/renderer/components/ReceiveModal';
import { splitNumberByStep } from '@/renderer/utils/number';
import { HistoryList } from './HistoryList';
import { TokenActionButton } from './TokenActionButton';

const supportChains = [...new Set(Object.values(DEX_SUPPORT_CHAINS).flat())];

type tokenContainer = {
  token?: TokenItem;
  handleReceiveClick: (token: TokenItem) => void;
  onCancel: () => void;
};
const Container = ({ token, handleReceiveClick, onCancel }: tokenContainer) => {
  const chainItem = getChain(token?.chain);
  const chainLogo =
    chainItem?.logo || 'rabby-internal://assets/icons/common/token-default.svg';
  const isNativeToken = chainItem?.nativeTokenAddress === token?.id;
  const tokenAddrDisplay = isNativeToken
    ? token?.symbol
    : ellipsis(token?.id || '');
  const ref = useRef<HTMLDivElement | null>(null);

  const navigate = useNavigate();

  const openScanUrl = useCallback(() => {
    if (isNativeToken || !chainItem?.scanLink || !token?.id) {
      return;
    }
    const link = chainItem?.scanLink?.replace(
      '/tx/_s_',
      `/address/${token?.id}`
    );
    openExternalUrl(link);
  }, [chainItem?.scanLink, isNativeToken, token?.id]);

  const buttons = useMemo(
    () => [
      {
        name: 'Swap',
        icon: IconSwap,
        onClick: () => {
          if (
            chainItem &&
            supportChains.includes(chainItem?.enum) &&
            chainItem?.serverId &&
            token?.id
          ) {
            navigate(
              `/mainwin/swap?${obj2query({
                chain: chainItem?.serverId,
                payTokenId: token?.id,
                rbisource: 'homeAsset',
              })}`
            );
            onCancel();
          }
        },
        disabled: !chainItem || !supportChains.includes(chainItem?.enum),
        disbaledTip: 'Tokens on this chain are not supported for swap',
      },
      {
        name: 'Send',
        icon: IconSend,
        onClick: () => {
          navigate(
            `/mainwin/home/send-token?token=${token?.chain}:${token?.id}&rbisource=homeAsset`
          );
          onCancel();
        },
      },
      {
        name: 'Receive',
        icon: IconReceive,
        onClick: () => {
          if (token) {
            handleReceiveClick(token);
            onCancel();
          }
        },
      },
    ],
    [chainItem, handleReceiveClick, navigate, onCancel, token]
  );
  if (!token || !chainItem) {
    return null;
  }
  return (
    <div className="flex flex-col h-full text-white">
      <div className="flex items-center gap-[6px] mb-[20px]">
        <img
          src={
            token.logo_url ||
            'rabby-internal://assets/icons/common/token-default.svg'
          }
          className="w-[24px] rounded-full"
        />
        <div className="text-[20px] leading-[24px] font-medium max-w-[276px] overflow-hidden overflow-ellipsis whitespace-nowrap">
          {getTokenSymbol(token)}
        </div>

        <div
          onClick={openScanUrl}
          className={clsx(
            'flex gap-6 py-4 px-8 rounded-[4px] items-center bg-opacity-20 bg-[#000] rounded-[4px]',
            !isNativeToken && 'cursor-pointer',
            'text-13'
          )}
        >
          <img src={chainLogo} className="w-14 h-14" />
          <span className="text-[#D3D8E0] text-13">{tokenAddrDisplay}</span>
          {!isNativeToken && (
            <img src={IconLink} className="w-14 h-14 opacity-60" />
          )}
        </div>
      </div>

      <div className="mb-[20px]">
        <TokenActionButton token={token} />

        <div
          className={clsx('flex items-center gap-6', 'text-[#BABEC5] text-14')}
        >
          <span>{getTokenSymbol(token)}</span>
          <span>Balance</span>
        </div>
        <div className="mt-[4px]">
          <span className="text-[24px] font-medium">
            {splitNumberByStep((token.amount || 0)?.toFixed(4))}
          </span>
          <span className="text-[14px] text-[#BABEC5] ml-[8px]">
            ≈ $
            {splitNumberByStep((token.amount * token.price || 0)?.toFixed(2))}
          </span>
        </div>
      </div>

      <div className="mt-auto flex justify-between flex items-center gap-12">
        {buttons.map((btn) => (
          <Tooltip
            trigger={['click']}
            title={btn?.disbaledTip}
            open={!btn.disabled ? false : undefined}
            overlayClassName="max-w-[500px]"
            overlayInnerStyle={{
              padding: '8px 12px',
            }}
          >
            <Button
              type="primary"
              className={clsx(
                'w-[133px] h-[44px] rounded-[6px] flex items-center text-[15px] font-medium ',
                btn.disabled && 'cursor-not-allowed opacity-30',
                'text-center justify-center border-[#7084FF]',
                btn.name !== 'Swap' && 'bg-transparent text-[#7084FF]',
                btn.name === 'Swap' && 'bg-[#7084FF]'
              )}
              onClick={btn.onClick}
            >
              <span>{btn.name}</span>
            </Button>
          </Tooltip>
        ))}
      </div>
      <HistoryList refContainer={ref} token={token} />
    </div>
  );
};

const StyledModal = styled(Modal)`
  .ant-modal-close-x {
    padding: 20px;
  }
`;

export const actionTokenAtom = atom<TokenItem | undefined>(undefined);

export const isSupportToken = (token?: TokenItem) => {
  return token && getChain(token?.chain);
};

export const useTokenAction = () => {
  const setToken = useSetAtom(actionTokenAtom);
  const cancelTokenAction = useCallback(() => {
    setToken(undefined);
  }, [setToken]);

  const enableTokenAction = true;

  const handleClickToken = useCallback(
    (t: TokenItem) => {
      if (!enableTokenAction || !t || !getChain(t?.chain)) {
        return;
      }
      setToken(t);
    },
    [enableTokenAction, setToken]
  );

  return {
    enableTokenAction,
    setTokenAction: handleClickToken,
    cancelTokenAction,
  };
};

export const TokenActionSymbol = ({
  token,
  enable = true,
  className,
  onClick,
  children,
  ...others
}: DetailedHTMLProps<React.HTMLAttributes<HTMLSpanElement>, HTMLSpanElement> & {
  token: TokenItem;
  enable?: boolean;
}) => {
  const isSupport = useMemo(
    () => enable && isSupportToken(token),
    [enable, token]
  );
  const { setTokenAction } = useTokenAction();
  const handleClick: React.MouseEventHandler<HTMLSpanElement> = useCallback(
    (e) => {
      if (isSupport) {
        setTokenAction(token);
      }
      onClick?.(e);
    },
    [isSupport, onClick, setTokenAction, token]
  );
  return (
    <span
      onClick={handleClick}
      className={clsx(
        className,
        isSupport && 'hover:underline hover:text-blue-light cursor-pointer'
      )}
      {...others}
    >
      {children || ellipsis(getTokenSymbol(token))}
    </span>
  );
};

export const TokenActionModal = memo(() => {
  const currentToken = useAtomValue(actionTokenAtom);
  const { cancelTokenAction } = useTokenAction();
  const [state, setState] = useState<{
    isShowReceiveModal: boolean;
    token?: string;
    chain?: CHAINS_ENUM;
  }>({
    isShowReceiveModal: false,
    token: undefined,
    chain: undefined,
  });

  const handleReceiveClick = useCallback((token: TokenItem) => {
    setState({
      isShowReceiveModal: true,
      token: getTokenSymbol(token),
      chain: getChain(token.chain)?.enum,
    });
  }, []);

  return (
    <>
      <StyledModal
        width={480}
        centered
        bodyStyle={{
          height: 600,
          padding: '20px',
        }}
        title={null}
        open={!!currentToken}
        onCancel={cancelTokenAction}
      >
        <Container
          token={currentToken}
          onCancel={cancelTokenAction}
          handleReceiveClick={handleReceiveClick}
        />
      </StyledModal>
      <ReceiveModal
        open={state.isShowReceiveModal}
        token={state.token}
        chain={state.chain}
        onCancel={() => {
          setState({
            isShowReceiveModal: false,
            token: undefined,
            chain: undefined,
          });
        }}
      />
    </>
  );
});
