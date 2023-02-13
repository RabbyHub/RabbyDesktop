/* eslint-disable react-hooks/exhaustive-deps */
import React from 'react';
import RcSwitch from 'rc-switch';
import { LoadingOutlined } from '@ant-design/icons';
import { Spin } from 'antd';

const LoadingIcon = (
  <LoadingOutlined style={{ fontSize: 20, color: '#8697ff' }} spin />
);

interface Props {
  onChange?: (value: boolean) => Promise<void>;
  checked?: boolean;
}
export const AddToRabby: React.FC<Props> = ({ checked, onChange }) => {
  const [locked, setLocked] = React.useState(false);

  const handleOnChange = React.useCallback(async (value: boolean) => {
    setLocked(true);
    await onChange?.(value);
    setLocked(false);
  }, []);
  return (
    <RcSwitch
      disabled={locked}
      onChange={handleOnChange}
      prefixCls="ant-switch"
      className="AddToRabby"
      checked={checked}
      loadingIcon={
        <div className="ant-switch-handle">
          {locked ? (
            <Spin className="icon-loading" indicator={LoadingIcon} />
          ) : checked ? (
            <img
              className="icon"
              src="rabby-internal://assets/icons/hd-manager/logo.svg"
            />
          ) : (
            <img
              className="icon"
              src="rabby-internal://assets/icons/hd-manager/logo-white.svg"
            />
          )}
        </div>
      }
    />
  );
};
