import classNames from 'classnames';
import { useAppUpdator } from '@/renderer/hooks/useAppUpdator';
import styled from 'styled-components';

import { useEffect } from 'react';
import IconDownloading from './icons/downloading.svg';
import LoadingDots from '../LoadingDots';

const UpdateBtn = styled.div`
  margin: 0 auto;
  text-align: center;

  .auto-update {
    background: var(--r-blue-default, #7084ff);
    border-radius: 4px;
    padding: 10px 12px;
    padding-right: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    height: 48px;
    gap: 6px;
    cursor: pointer;

    color: var(--r-neutral-title-2, #fff);
    text-align: center;
    font-size: 15px;
    font-weight: 510;
    font-weight: 500;
    min-width: 148px;

    transition: width var(--mainwin-sidebar-animation-second);

    &:hover {
      opacity: 0.9;
    }

    a {
      color: var(--color-purewhite);
      text-decoration: underline;
      font-weight: 700;
      font-size: 16px;
      line-height: 19px;
    }

    &.is-downloading,
    &.is-downloaded {
      a {
        color: var(--color-purewhite);
        text-decoration: underline;
        font-weight: 500;
        font-size: 16px;
        line-height: 19px;
      }
    }
    &.is-downloading {
      background: var(--r-blue-disable, rgba(112, 132, 255, 0.3));
    }
    &.is-downloaded {
      background: var(--r-green-default, #2abb7f);
    }
  }
  .auto-update-icon {
    width: 20px;
    height: 20px;

    &.is-animate {
      animation: rotate 1.5s linear infinite;
    }
  }
  .auto-update-content {
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
  }
  .auto-update-action {
    margin-left: auto;
  }
`;

export const UpdateButton = ({ className }: { className?: string }) => {
  const {
    releaseCheckInfo,
    isDownloading,
    isDownloaded,
    isDownloadedFailed,
    requestDownload,
    progress,
    quitAndUpgrade,
    stepVerification,
    verifyDownloadedPackage,
  } = useAppUpdator();

  if (!releaseCheckInfo.hasNewRelease) {
    return null;
  }

  if (isDownloading) {
    return (
      <UpdateBtn className={className}>
        <div className="auto-update is-downloading">
          <img
            src={IconDownloading}
            className="auto-update-icon is-animate"
            alt=""
          />
          <div className="auto-update-content">
            <span>Downloading</span>
            {!!progress?.percent && (
              <span className="ml-[2px]">
                {(progress?.percent || 0).toFixed(0)}%
              </span>
            )}
          </div>
        </div>
      </UpdateBtn>
    );
  }

  if (isDownloaded && stepVerification !== 'finish') {
    return (
      <UpdateBtn className={className}>
        <div
          className="auto-update is-verifying"
          onClick={() => {
            if (stepVerification === 'wait') {
              verifyDownloadedPackage();
            }
          }}
        >
          <div className="auto-update-content">
            Verify
            {stepVerification === 'process' && (
              <LoadingDots className="ml-[2px] text-left inline-block w-[14px]" />
            )}
          </div>
        </div>
      </UpdateBtn>
    );
  }

  if (isDownloaded && !isDownloadedFailed) {
    return (
      <UpdateBtn className={className}>
        <div
          className="auto-update is-downloaded"
          onClick={(evt) => {
            evt.stopPropagation();
            quitAndUpgrade();
          }}
        >
          <div className="auto-update-content">Restart</div>
        </div>
      </UpdateBtn>
    );
  }
  return (
    <UpdateBtn className={classNames(className)}>
      <div
        className="auto-update"
        onClick={(evt) => {
          evt.stopPropagation();
          requestDownload();
        }}
      >
        <div className="auto-update-content">Update</div>
      </div>
    </UpdateBtn>
  );
};
