import React from 'react';
import { useTokenAtom } from '@/renderer/hooks/rabbyx/useToken';
import { TokenButton } from './TokenButton';

interface Props {
  onClickLink: () => void;
  // isTestnet?: boolean;
}

export const CustomizedButton: React.FC<Props> = ({ onClickLink }) => {
  const { customize } = useTokenAtom();

  return (
    <TokenButton
      label="customized"
      linkText="Search address to add custom token"
      description="Custom token added by you will be shown here"
      tokens={customize}
      onClickLink={onClickLink}
    />
  );
};
