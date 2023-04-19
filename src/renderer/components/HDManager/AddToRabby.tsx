/* eslint-disable react-hooks/exhaustive-deps */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import RcSwitch from 'rc-switch';
import { LoadingOutlined } from '@ant-design/icons';
import { Spin } from 'antd';
import { useClickOutSide } from '@/renderer/hooks/useClick';
import { TipsWrapper } from '../TipWrapper';

const LoadingIcon = (
  <LoadingOutlined style={{ fontSize: 20, color: '#8697ff' }} spin />
);

interface Props {
  onChange?: (value: boolean) => Promise<void>;
  checked?: boolean;
}
export const AddToRabby: React.FC<Props> = ({ checked, onChange }) => {
  const [locked, setLocked] = React.useState(false);

  const [showClickedTips, setShowClickedTips] = useState<true | undefined>();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const timerRef = useRef<NodeJS.Timeout>();

  useClickOutSide(buttonRef, () => {
    setShowClickedTips(undefined);
  });

  const handleClickTips = useCallback(() => {
    setShowClickedTips(true);
    timerRef.current = setTimeout(() => {
      setShowClickedTips(undefined);
    }, 3000);
  }, []);

  const handleOnChange = React.useCallback(
    async (value: boolean) => {
      setLocked(true);
      await onChange?.(value);
      setLocked(false);

      handleClickTips();
    },
    [handleClickTips]
  );

  useEffect(() => () => clearTimeout(timerRef.current), []);

  return (
    <TipsWrapper
      open={showClickedTips}
      hoverTips={
        showClickedTips
          ? checked
            ? 'Added'
            : 'Removed'
          : checked
          ? 'Remove from Rabby'
          : 'Add to Rabby'
      }
    >
      <RcSwitch
        ref={buttonRef}
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
    </TipsWrapper>
  );
};
