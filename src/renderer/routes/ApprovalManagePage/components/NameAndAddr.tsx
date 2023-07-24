import React from 'react';
import NameAndAddress from '@/renderer/components/NameAndAddress';

import clsx from 'clsx';
import IconCopy from '../icons/icon-copy.svg';

type Props = Omit<React.ComponentProps<typeof NameAndAddress>, 'copyIcon'>;

export default function ApprovalsNameAndAddr({
  copyIconClass,
  ...props
}: Props) {
  return (
    <NameAndAddress
      {...props}
      copyIcon={IconCopy}
      copyIconOpacity={100}
      copyIconClass={clsx(copyIconClass, 'w-[16px] h-[16px] inline-block')}
    />
  );
}
