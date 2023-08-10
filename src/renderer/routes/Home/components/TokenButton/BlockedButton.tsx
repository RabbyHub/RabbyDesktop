import React from 'react';
import { useToken } from '@/renderer/hooks/rabbyx/useToken';
import { TokenItem } from '@rabby-wallet/rabby-api/dist/types';
import { TokenButton } from './TokenButton';

interface Props {
  onClickLink: () => void;
  // isTestnet?: boolean;
  tokenList: TokenItem[];
}

export const BlockedButton: React.FC<Props> = ({ onClickLink, tokenList }) => {
  const { blocked } = useToken({ tokenList });

  return (
    <TokenButton
      label="blocked"
      tokens={blocked}
      linkText="Search address to block token"
      description="Token blocked by you will be shown here"
      onClickLink={onClickLink}
      hiddenSubTitle
    />
  );
};
