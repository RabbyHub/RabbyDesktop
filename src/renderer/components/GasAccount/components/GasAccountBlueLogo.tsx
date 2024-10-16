import React from 'react';
import clsx from 'clsx';

export const GasAccountBlueLogo = (
  props: React.DetailedHTMLProps<
    React.HTMLAttributes<HTMLDivElement>,
    HTMLDivElement
  >
) => {
  const { className } = props;
  return (
    <div {...props} className={clsx('w-[60px] h-[60px] relative', className)}>
      <img
        src="rabby-internal://assets/icons/gas-account/gas-account-blue-blur.svg"
        className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2"
      />
      <img
        src="rabby-internal://assets/icons/gas-account/gas-account-blue.svg"
        className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2"
      />
    </div>
  );
};
