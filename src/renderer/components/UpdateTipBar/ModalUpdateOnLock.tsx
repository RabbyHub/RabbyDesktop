import React from 'react';
import { Modal } from '@/renderer/components/Modal/Modal';
import { atom, useAtom } from 'jotai';
import styled from 'styled-components';
import { useCheckNewRelease } from '@/renderer/hooks/useAppUpdator';
import ChangeLogContent from '../ChangeLogContent';
import { UpdateButton } from './UpdateBtn';

const StyledModal = styled(Modal)`
  .ant-modal-content {
    height: 400px;
  }

  .ant-modal-body,
  .inner-wrapper {
    height: calc(100% - 24px);
  }

  .inner-wrapper {
    padding-top: 0;
    padding-bottom: 40px;
    padding-left: 32px;
    padding-right: 32px;

    display: flex;
    flex-direction: column;
    align-items: space-between;
    justify-content: flex-start;
  }

  .changelogVersion {
    color: var(--r-neutral-body, #d3d8e0);
    text-align: center;
    font-size: 15px;
    font-weight: 400;
    margin-bottom: 0;

    position: relative;
    top: -8px;
  }

  .changelogTextWrapper {
    height: 100%;
    flex-shrink: 1;
    overflow-y: auto;
  }

  .changelogText {
    color: var(--r-neutral-title-2, #fff);
    text-align: center;
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
      font-size: 12px;
    }

    * {
      color: var(--color-purewhite) !important;
    }
  }

  .changelogButtonWrapper {
    padding-top: 24px;
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

  const { releaseCheckInfo } = useCheckNewRelease();

  return (
    <StyledModal
      width={480}
      title="New Version"
      smallTitle
      centered
      className="common-light-modal"
      open={isShowModalUpdateOnLock}
      onCancel={() => setIsShowModalUpdateOnLock(false)}
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

        <div className="changelogButtonWrapper">
          <UpdateButton className="w-[220px] h-[48px]" />
        </div>
      </div>
    </StyledModal>
  );
};
