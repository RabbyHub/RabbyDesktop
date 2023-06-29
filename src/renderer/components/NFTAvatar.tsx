import { NFTItem } from '@rabby-wallet/rabby-api/dist/types';
import { Image } from 'antd';
import clsx from 'classnames';
import React from 'react';
import { getChain } from '@/renderer/utils';
import styled from 'styled-components';
import IconImgFail from '../../../assets/icons/common/img-fail.svg';
import IconNFTDefault from '../../../assets/icons/common/nft-default.svg';
import IconUnknown from '../../../assets/icons/common/token-default.svg';
import IconZoom from '../../../assets/icons/common/zoom.svg';

type AvatarProps = {
  content?: string;
  thumbnail?: boolean;
  chain?: string;
  type?: NFTItem['content_type'];
  className?: string;
  style?: React.CSSProperties;
  onPreview?: () => void;
  amount?: number;
  unknown?: string;
};

const Thumbnail = ({
  content,
  type,
  unknown,
}: Pick<AvatarProps, 'content' | 'type' | 'unknown'>) => {
  if (type && ['video_url'].includes(type) && content) {
    return (
      // eslint-disable-next-line jsx-a11y/media-has-caption
      <video
        src={content}
        preload="metadata"
        className="nft-avatar-image"
        controlsList="nodownload nofullscreen noplaybackrate"
        disablePictureInPicture
      />
    );
  }
  const src =
    type && ['image', 'image_url'].includes(type) && content
      ? content
      : unknown || IconNFTDefault;
  return (
    <Image
      src={src}
      className="nft-avatar-image"
      preview={false}
      fallback={IconImgFail}
    />
  );
};

const Preview = ({ content, type }: Pick<AvatarProps, 'content' | 'type'>) => {
  if (type && ['image', 'image_url'].includes(type) && content) {
    return (
      <Image
        src={content}
        className="nft-avatar-image"
        preview={false}
        fallback={IconImgFail}
      />
    );
  }
  if (type && ['video_url', 'audio_url'].includes(type) && content) {
    return (
      // eslint-disable-next-line jsx-a11y/media-has-caption
      <video
        src={content}
        controls
        className="nft-avatar-image"
        controlsList="nodownload nofullscreen noplaybackrate"
        disablePictureInPicture
      />
    );
  }
  return <img src={IconNFTDefault} className="nft-avatar-image" alt="" />;
};

const StyledFftAvatar = styled.div`
  position: relative;
  border-radius: 4px;
  width: 60px;
  height: 60px;
  background-color: #fff;
  overflow: hidden;
  &:hover {
    .nft-avatar-cover {
      display: flex;
    }
  }
  .ant-image {
    width: 100%;
    height: 100%;
  }
  .nft-avatar-image {
    width: 100% !important;
    height: 100% !important;
    object-fit: cover;
  }
  .nft-avatar-chain {
    position: absolute;
    top: -7px;
    right: -7px;
    width: 14px;
    height: 14px;
    z-index: 1;
  }
  .nft-avatar-cover {
    position: absolute;
    inset: 0;
    background-color: rgba(0, 0, 0, 0.6);
    align-items: center;
    justify-content: center;
    display: none;
    cursor: pointer;
  }
  .nft-avatar-count {
    position: absolute;
    top: 4px;
    right: 4px;
    font-size: 12px;
    line-height: 14px;
    background: rgba(0, 0, 0, 0.4);
    border-radius: 2px;
    padding: 1px 5px;
    color: #fff;
  }
`;

const NFTAvatar = ({
  thumbnail = true,
  type,
  content,
  chain,
  className,
  style,
  onPreview,
  unknown,
  amount,
}: AvatarProps) => {
  const logo = getChain(chain)?.logo || IconUnknown;
  const isShowLogo = !!chain;
  return (
    <StyledFftAvatar className={clsx('nft-avatar', className)} style={style}>
      {thumbnail ? (
        <Thumbnail content={content} type={type} unknown={unknown} />
      ) : (
        <Preview content={content} type={type} />
      )}
      {amount && amount > 1 && (
        <div className="nft-avatar-count">x{amount}</div>
      )}
      {isShowLogo && <img src={logo} className="nft-avatar-chain" />}
      {thumbnail && onPreview && (
        <div className="nft-avatar-cover" onClick={onPreview}>
          <img src={IconZoom} alt="" />
        </div>
      )}
    </StyledFftAvatar>
  );
};

export default NFTAvatar;
