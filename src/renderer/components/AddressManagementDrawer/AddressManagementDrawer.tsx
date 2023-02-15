import { Drawer } from 'antd';
import React from 'react';
import { MainContainer } from './MainContainer';

interface Props {
  visible: boolean;
  onClose: () => void;
}

/**
 * @deprecated
 */
export const AddressManagementDrawer: React.FC<Props> = ({
  visible,
  onClose,
}) => {
  return (
    <Drawer
      width={400}
      bodyStyle={{
        background: 'linear-gradient(112.9deg, #6F7584 0%, #3B404D 100%)',
        boxShadow: '0px 24px 80px rgba(19, 20, 26, 0.18)',
        padding: 0,
      }}
      closable={false}
      open={visible}
      onClose={onClose}
    >
      <MainContainer />
    </Drawer>
  );
};
