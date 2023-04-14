import { useZPopupViewState } from '@/renderer/hooks/usePopupWinOnMainwin';
import React, { useEffect, useRef } from 'react';
import clsx from 'clsx';
import { Dropdown } from 'antd';
import { MainContainer } from './MainContainer';

export const AddressManagementModal: React.FC = () => {
  const { svVisible, closeSubview, svState } =
    useZPopupViewState('address-management');
  const divRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (svVisible) {
      divRef.current?.click();
    }
  }, [svVisible]);

  return (
    <Dropdown
      overlayClassName={clsx(svState?.hidden && 'h-0 overflow-hidden')}
      overlay={<MainContainer />}
      trigger={['click']}
      onOpenChange={(open) => {
        if (!open) {
          closeSubview();
        }
      }}
    >
      <div ref={divRef} className="w-[440px] h-40 absolute right-10 top-10  " />
    </Dropdown>
  );
};
