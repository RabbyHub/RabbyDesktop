import { useTokenAtom } from '@/renderer/hooks/rabbyx/useToken';
import React from 'react';
import { TokenButton } from './TokenButton';

interface Props {
  onAddClick: () => void;
}

export const CustomizedButton: React.FC<Props> = ({ onAddClick }) => {
  const { customize } = useTokenAtom();

  return (
    <TokenButton
      label={customize.length > 1 ? 'customized tokens' : 'customized token'}
      description="Custom token added by you will be shown here"
      tokens={customize}
      onAddClick={onAddClick}
    />
  );
};
