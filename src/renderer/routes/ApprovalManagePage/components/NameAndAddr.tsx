import React from 'react';
import NameAndAddress from '@/renderer/components/NameAndAddress';

import IconCopy from '../icons/icon-copy.svg';

type Props = Omit<React.ComponentProps<typeof NameAndAddress>, 'copyIcon'>;

export default function ApprovalsNameAndAddr(props: Props) {
  return <NameAndAddress {...props} copyIcon={IconCopy} />;
}
