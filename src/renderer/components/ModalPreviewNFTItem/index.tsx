import React, { useCallback, useMemo } from 'react';
import styled from 'styled-components';

import clsx from 'clsx';
import { NFTItem } from '@rabby-wallet/rabby-api/dist/types';
import { getChain } from '@/renderer/utils';
import { Button, Tooltip } from 'antd';
import { useNavigate } from 'react-router-dom';
import { formatUsdValue } from '@/renderer/utils/number';
import IconExternal from '@/../assets/icons/tx-toast/external-link.svg';
import { openExternalUrl } from '@/renderer/ipcRequest/app';
import NFTAvatar from '../NFTAvatar';
import { Modal, Props } from '../Modal/Modal';

const PreviewModal = styled(Modal)`
  &.RabbyModal {
    .ant-modal-header {
      padding-top: 16px;
      padding-bottom: 0;
      font-size: 20px;
      font-weight: 510;
    }
    .ant-modal-close-x {
      padding-top: 18px;
      padding-right: 16px;
      opacity: 0.7;
    }

    .ant-modal-body {
      padding: 12px;
    }
  }
`;

const PreviewCard = styled.div`
  color: white;

  .nft-avatar {
    width: 100%;
    height: 306px;
  }

  .nft-txpreview-title-wrapper {
    padding-top: 16px;
    padding-bottom: 12px;
    border-bottom: 1px solid rgba(229, 233, 239, 0.1);
    display: flex;
    align-items: center;
    .title {
      font-weight: 500;
      font-size: 15px;
      line-height: 18px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      color: white;
      max-width: calc(100% - 22px);
    }

    .icon {
      width: 18px;
      height: 18px;
      margin-left: 4px;
      cursor: pointer;
      opacity: 0.6;
    }
  }
  .nft-txpreview-properties {
    padding-top: 12px;
    margin-bottom: 16px;
  }
  .nft-txpreview-property {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 12px;
    &:nth-last-child(1) {
      margin-bottom: 0;
    }
  }
  .nft-txpreview-property-label {
    font-weight: 500;
    font-size: 12px;
    line-height: 14px;
  }
  .nft-txpreview-property-value {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    font-size: 12px;
    line-height: 14px;
    color: rgba(255, 255, 255, 0.6);
  }
  .nft-send-btn {
    border-radius: 6px;
    height: 44px;
    font-size: 13px;
    font-weight: 500;
  }
`;

export default function ModalPreviewNFTItem({
  nft,
  collectionName,
  onSend,
  ...props
}: { nft?: NFTItem; collectionName?: string; onSend?: () => void } & Props) {
  const collectProperty = nft?.collection;
  const chainName = React.useMemo(() => {
    return getChain(nft?.chain)?.name || '-';
  }, [nft?.chain]);

  const disabled = useMemo(() => {
    return !nft?.is_erc1155 && !nft?.is_erc721;
  }, [nft]);

  const navigate = useNavigate();

  const handleClickSend = useCallback(() => {
    navigate(
      {
        pathname: '/mainwin/home/send-nft',
        search: `?rbisource=nftdetail&collectionName=${
          collectProperty?.name || collectionName
        }`,
      },
      {
        state: {
          nftItem: nft,
        },
        replace: true,
      }
    );
    onSend?.();
  }, [collectProperty?.name, collectionName, navigate, nft, onSend]);

  return (
    <PreviewModal
      {...props}
      visible={!!nft}
      centered
      width={330}
      smallTitle
      title="NFT Detail"
      footer={null}
      className={clsx('nft-txpreview-modal', props.className)}
    >
      <PreviewCard className="nft-txpreview-card">
        <NFTAvatar
          thumbnail={false}
          content={nft?.content}
          type={nft?.content_type}
          amount={nft?.amount}
        />
        <div className="nft-txpreview-title-wrapper">
          <span className="title">{nft?.name || '-'}</span>
          <img
            src={IconExternal}
            className="icon"
            onClick={() => {
              openExternalUrl(nft.detail_url);
            }}
          />
        </div>
        <div className="nft-txpreview-properties">
          <div className="nft-txpreview-property">
            <div className="nft-txpreview-property-label">Collection</div>
            <div className="nft-txpreview-property-value">
              {collectProperty?.name || collectionName || '-'}
            </div>
          </div>
          <div className="nft-txpreview-property">
            <div className="nft-txpreview-property-label">Chain</div>
            <div className="nft-txpreview-property-value">{chainName}</div>
          </div>
          <div className="nft-txpreview-property">
            <div className="nft-txpreview-property-label">Purchase Date</div>
            <div className="nft-txpreview-property-value">
              {nft?.pay_token?.date_at || '-'}
            </div>
          </div>
          <div className="nft-txpreview-property">
            <div className="nft-txpreview-property-label">Last Price</div>
            <div className="nft-txpreview-property-value">
              {nft?.usd_price ? `${formatUsdValue(nft?.usd_price)}` : '-'}
            </div>
          </div>
        </div>
        <Tooltip
          title={
            disabled
              ? 'Only ERC 721 and ERC 1155 NFTs are supported for now'
              : null
          }
          overlayClassName="rectangle"
        >
          <Button
            className="nft-send-btn"
            type="primary"
            block
            disabled={disabled}
            onClick={handleClickSend}
          >
            Send
          </Button>
        </Tooltip>
      </PreviewCard>
    </PreviewModal>
  );
}
