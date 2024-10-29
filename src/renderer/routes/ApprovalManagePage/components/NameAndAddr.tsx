import React from 'react';
import NameAndAddress from '@/renderer/components/NameAndAddress';

type Props = Omit<React.ComponentProps<typeof NameAndAddress>, ''>;

export default function ApprovalsNameAndAddr({
  copyIconClass,
  ...props
}: Props) {
  return <NameAndAddress {...props} copyIcon={false} />;
}
