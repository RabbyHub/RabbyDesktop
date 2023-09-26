import React, { useCallback } from 'react';
import { Modal } from '@/renderer/components/Modal/Modal';
import { atom, useAtom } from 'jotai';
import styled from 'styled-components';
import {
  useAppUpdator,
  useCheckNewRelease,
} from '@/renderer/hooks/useAppUpdator';
import ChangeLogContent from '../ChangeLogContent';
import { BottomUpdateButtonArea } from './UpdateBtn';

const ChangelogVersionH = 24;
const BottomAreaHeight = 148;

const StyledModal = styled(Modal)`
  .ant-modal-content {
    height: 460px;
  }

  .ant-modal-body {
    /* offset header */
    height: calc(100% - 64px);
  }

  .inner-wrapper {
    max-height: 100%;
    height: 100%;
    padding-top: 0;
    padding-bottom: 0;
    padding-left: 0;
    padding-right: 0;

    display: flex;
    flex-direction: column;
    align-items: space-between;
    justify-content: flex-start;

    > * {
      flex-shrink: 0;
    }
  }

  .changelogVersion {
    height: ${ChangelogVersionH}px;
    color: var(--r-neutral-body, #d3d8e0);
    text-align: center;
    font-size: 15px;
    font-weight: 400;
    margin-bottom: 0;

    position: relative;
    top: -8px;
  }

  .changelogTextWrapper {
    padding-left: 32px;
    padding-right: 32px;
    height: 100%;
    flex-shrink: 1;
    overflow-y: auto;
  }

  .changelogText {
    color: var(--r-neutral-title-2, #fff);
    text-align: left;
    font-size: 15px;
    font-style: normal;
    font-weight: 400;
    line-height: 22px;
    margin-bottom: 0;
    line-height: 20px;

    > ul,
    p:last-child {
      margin-bottom: 0;
    }

    > ul {
      padding-left: 16px;
    }

    > ul li,
    p {
      font-size: 15px;
    }

    * {
      color: var(--color-purewhite) !important;
    }
  }

  .changelogButtonWrapper {
    padding-top: 0;
    height: ${BottomAreaHeight}px;
  }

  .changelogButton {
    display: flex;
    margin: 0 auto;
    justify-content: center;
    align-items: center;
    flex-shrink: 0;

    border-radius: 4px;

    color: var(--r-neutral-title-2, #fff);
    text-align: center;
    font-size: 15px;
    font-style: normal;
    font-weight: 500;
    line-height: normal;
  }
`;

const showModalUpdateOnLock = atom(false);

export function useShowModalUpdateOnLock() {
  const [isShowModalUpdateOnLock, setIsShowModalUpdateOnLock] = useAtom(
    showModalUpdateOnLock
  );

  return {
    isShowModalUpdateOnLock,
    setIsShowModalUpdateOnLock,
  };
}

export const ModalUpdateOnLock: React.FC = () => {
  const { isShowModalUpdateOnLock, setIsShowModalUpdateOnLock } =
    useShowModalUpdateOnLock();
  const { resetDownloadWork } = useAppUpdator();

  const { releaseCheckInfo } = useCheckNewRelease();

  const onCancel = useCallback(() => {
    resetDownloadWork({ clearDownloaded: false });
    setIsShowModalUpdateOnLock(false);
  }, [resetDownloadWork, setIsShowModalUpdateOnLock]);

  return (
    <StyledModal
      width={480}
      title="New Version"
      smallTitle
      centered
      className="common-light-modal"
      open={isShowModalUpdateOnLock}
      onCancel={onCancel}
    >
      <div className="inner-wrapper">
        <div className="changelogVersion">
          {releaseCheckInfo.releaseVersion || ''}
        </div>
        <div className="changelogTextWrapper">
          <ChangeLogContent className="changelogText">
            {releaseCheckInfo.releaseNote || ''}
          </ChangeLogContent>
        </div>

        <BottomUpdateButtonArea
          onCancel={onCancel}
          className="changelogButtonWrapper"
        />
      </div>
    </StyledModal>
  );
};
