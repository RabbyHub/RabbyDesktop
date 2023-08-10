import React from 'react';
import { useToken } from '@/renderer/hooks/rabbyx/useToken';
import { TokenItem } from '@rabby-wallet/rabby-api/dist/types';
import { TokenButton } from './TokenButton';

interface Props {
  onClickLink: () => void;
  // isTestnet?: boolean;
  tokenList: TokenItem[];
}

export const CustomizedButton: React.FC<Props> = ({
  onClickLink,
  tokenList,
}) => {
  const { customize } = useToken({ tokenList });

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
