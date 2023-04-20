import { IconLink } from '@/../assets/icons/mainwin-settings';
import { Modal } from '@/renderer/components/Modal/Modal';
import { ellipsis } from '@/renderer/utils/address';
import { TokenItem } from '@debank/rabby-api/dist/types';
import { Button, Tooltip } from 'antd';
import { useCallback, useMemo, useState, memo } from 'react';
import { openExternalUrl } from '@/renderer/ipcRequest/app';
import clsx from 'clsx';
import IconReceive from '@/../assets/icons/home-widgets/receive.svg';
import IconSend from '@/../assets/icons/home-widgets/send.svg';
import IconSwap from '@/../assets/icons/home-widgets/swap.svg';
import styled from 'styled-components';
import { DEX_SUPPORT_CHAINS } from '@rabby-wallet/rabby-swap';
import { useLocation, useNavigate } from 'react-router-dom';
import { obj2query } from '@/renderer/utils/url';
import { getChain } from '@/renderer/utils';
import { atom, useAtomValue, useSetAtom } from 'jotai';
import { ReceiveModal } from '@/renderer/components/ReceiveModal';

const supportChains = [...new Set(Object.values(DEX_SUPPORT_CHAINS).flat())];

type tokenContainer = {
  token?: TokenItem;
  handleReceiveClick: (token: TokenItem) => void;
  onCancel: () => void;
};
const Container = ({ token, handleReceiveClick, onCancel }: tokenContainer) => {
  const chainItem = getChain(token?.chain);
  const chianLogo =
    chainItem?.logo || 'rabby-internal://assets/icons/common/token-default.svg';

  const isNativeToken = chainItem.nativeTokenAddress === token?.id;

  const tokenAddrDisplay = isNativeToken
    ? token?.symbol
    : ellipsis(token?.id || '');

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
        disabled: !supportChains.includes(chainItem?.enum),
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
      <div className="flex items-center">
        <img src={token.logo_url} className="w-[34px] rounded-full" />
        <div className="mx-[15px] text-[30px] leading-[36px] font-medium max-w-[276px] overflow-hidden overflow-ellipsis whitespace-nowrap">
          {token.symbol}
        </div>

        <div
          onClick={openScanUrl}
          className={clsx(
            'flex gap-6 py-6 px-8 rounded-[4px] items-center bg-opacity-20 bg-[#000] rounded-[4px]',
            !isNativeToken && 'cursor-pointer'
          )}
        >
          <img src={chianLogo} className="w-14 h-14" />
          <span className="text-white text-opacity-60">{tokenAddrDisplay}</span>
          {!isNativeToken && (
            <img src={IconLink} className="w-14 h-14 opacity-60" />
          )}
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
                'w-[165px] h-[50px] rounded-[6px] flex pl-[32px] items-center text-[16px] font-medium ',
                btn.disabled && 'cursor-not-allowed opacity-30'
              )}
              onClick={btn.onClick}
            >
              <img src={btn.icon} className="w-[34px] mr-6" />
              <span>{btn.name}</span>
            </Button>
          </Tooltip>
        ))}
      </div>
    </div>
  );
};

const StyledModal = styled(Modal)`
  .ant-modal-close-x {
    padding-top: 30px;
    padding-right: 30px;
  }
`;

export const actionTokenAtom = atom<TokenItem | undefined>(undefined);

export const useTokenAction = () => {
  const setToken = useSetAtom(actionTokenAtom);
  const cancelTokenAction = useCallback(() => {
    setToken(undefined);
  }, [setToken]);

  const location = useLocation();
  const enableTokenAction = useMemo(
    () => location.pathname !== '/mainwin/home/bundle',
    [location.pathname]
  );

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
      token: token.symbol,
      chain: getChain(token.chain)?.enum,
    });
  }, []);

  return (
    <>
      <StyledModal
        width={584}
        centered
        bodyStyle={{
          height: 224,
          padding: '40px 32px',
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
