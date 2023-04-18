import { IconLink } from '@/../assets/icons/mainwin-settings';
import { Modal, Props as ModalProps } from '@/renderer/components/Modal/Modal';
import { ellipsis } from '@/renderer/utils/address';
import { TokenItem } from '@debank/rabby-api/dist/types';
import { Button, Tooltip } from 'antd';
import { useCallback, useMemo } from 'react';
import { openExternalUrl } from '@/renderer/ipcRequest/app';
import clsx from 'clsx';
import IconReceive from '@/../assets/icons/home-widgets/receive.svg';
import IconSend from '@/../assets/icons/home-widgets/send.svg';
import IconSwap from '@/../assets/icons/home-widgets/swap.svg';
import styled from 'styled-components';
import { DEX_SUPPORT_CHAINS } from '@rabby-wallet/rabby-swap';
import { useNavigate } from 'react-router-dom';
import { obj2query } from '@/renderer/utils/url';
import { getChain } from '@/renderer/utils';

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
    if (isNativeToken || !chainItem?.scanLink || !token.id) {
      return;
    }
    const link = chainItem?.scanLink?.replace(
      '/tx/_s_',
      `/address/${token?.id}`
    );
    openExternalUrl(link);
  }, [chainItem?.scanLink, isNativeToken, token.id]);

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
        disbaledTip: 'The token on this chain is not supported',
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
        <img src={token.logo_url} className="w-[34px]" />
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
            overlayInnerStyle={{
              padding: '8px 12px',
              paddingRight: 4,
              maxWidth: 233,
              fontSize: 15,
              fontWeight: 500,
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

export const TokenActionModal = (props: tokenContainer & ModalProps) => {
  const { token, handleReceiveClick, ...other } = props;

  return (
    <StyledModal
      width={584}
      centered
      bodyStyle={{
        height: 224,
        padding: '40px 32px',
      }}
      title={null}
      open={!!token}
      {...other}
    >
      <Container
        token={token}
        onCancel={other.onCancel}
        handleReceiveClick={handleReceiveClick}
      />
    </StyledModal>
  );
};
