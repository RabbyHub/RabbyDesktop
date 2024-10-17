import React from 'react';
import { detectClientOS } from '@/isomorphic/os';
import clsx from 'clsx';

const isWin32 = detectClientOS() === 'win32';

export const GasAccountWrapperBg = ({
  children,
  className,
  ...others
}: React.DetailedHTMLProps<
  React.HTMLAttributes<HTMLDivElement>,
  HTMLDivElement
>) => {
  return (
    <div {...others} className={clsx('relative overflow-hidden', className)}>
      <img
        src={
          isWin32
            ? 'rabby-internal://assets/icons/gas-account/bg-win.svg'
            : 'rabby-internal://assets/icons/gas-account/bg.svg'
        }
        className="absolute top-0"
      />
      {children}
    </div>
  );
};
