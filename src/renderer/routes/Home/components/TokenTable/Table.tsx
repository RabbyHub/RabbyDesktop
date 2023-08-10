import clsx from 'clsx';
import React from 'react';

export const Table: React.FC<React.HTMLProps<HTMLTableElement>> = ({
  className,
  ...attrs
}) => {
  return <div {...attrs} className={clsx('block -mx-20', className)} />;
};

export const TRow: React.FC<React.HTMLProps<HTMLTableRowElement>> = ({
  className,
  ...attrs
}) => {
  return (
    <div {...attrs} className={clsx('flex items-center px-20', className)} />
  );
};

export const TCell: React.FC<React.HTMLProps<HTMLTableCellElement>> = ({
  className,
  ...attrs
}) => {
  return <div {...attrs} className={clsx('block', className)} />;
};

export const THeader: React.FC<React.HTMLProps<HTMLTableSectionElement>> = ({
  children,
  className,
  ...attrs
}) => {
  return (
    <div {...attrs} className={clsx('block', className)}>
      <TRow className="w-full">{children}</TRow>
    </div>
  );
};

export const THeadCell: React.FC<React.HTMLProps<HTMLTableCellElement>> = ({
  className,
  ...attrs
}) => {
  return (
    <div
      {...attrs}
      className={clsx(
        'uppercase text-[#babec5] text-12 font-normal block',
        className
      )}
    />
  );
};

export const TBody: React.FC<React.HTMLProps<HTMLTableSectionElement>> = ({
  className,
  ...attrs
}) => {
  return <div {...attrs} className={clsx('block', className)} />;
};
