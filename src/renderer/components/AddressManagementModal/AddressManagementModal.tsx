import React from 'react';
import clsx from 'clsx';
import { Dropdown } from 'antd';
import styled from 'styled-components';
import { useZPopupViewState } from '@/renderer/hooks/usePopupWinOnMainwin';
import { MainContainer } from './MainContainer';

const TriggerEl = styled.div`
  top: calc(var(--mainwin-mainroute-topoffset) + 10px);
`;

export const AddressManagementModal: React.FC = () => {
  const { svVisible, closeSubview } = useZPopupViewState('address-management');

  return (
    <Dropdown
      overlayClassName={clsx(
        'min-w-[400px]',
        !svVisible && 'h-0 overflow-hidden'
      )}
      overlay={<MainContainer />}
      open={svVisible}
      trigger={['click']}
      onOpenChange={(open) => {
        if (!open) {
          closeSubview();
        }
      }}
      destroyPopupOnHide
    >
      <TriggerEl className="w-[400px] h-40 absolute right-10" />
    </Dropdown>
  );
};
