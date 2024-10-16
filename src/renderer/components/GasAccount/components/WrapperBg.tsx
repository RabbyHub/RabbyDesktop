import React from 'react';
import clsx from 'clsx';

export const GasAccountWrapperBg = ({
  children,
  className,
  ...others
}: React.DetailedHTMLProps<
  React.HTMLAttributes<HTMLDivElement>,
  HTMLDivElement
>) => {
  return (
    <div {...others} className={clsx('relative', className)}>
      <img
        src="rabby-internal://assets/icons/gas-account/bg.svg"
        className="absolute top-0"
      />
      {children}
    </div>
  );
};
