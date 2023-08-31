import React from 'react';
import { useTokenAtom } from '@/renderer/hooks/rabbyx/useToken';
import { TokenButton } from './TokenButton';

interface Props {
  onClickLink: () => void;
}

export const BlockedButton: React.FC<Props> = ({ onClickLink }) => {
  const { blocked } = useTokenAtom();

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
