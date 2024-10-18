/* eslint-disable @typescript-eslint/no-explicit-any */
import clsx from 'clsx';

export const GasAccountCloseIcon = ({ className, ...others }: any) => (
  <img
    src="rabby-internal://assets/icons/gas-account/IconClose.svg"
    {...others}
    className={clsx('w-[20px] h-[20px] text-r-neutral-foot mt-4', className)}
  />
);
