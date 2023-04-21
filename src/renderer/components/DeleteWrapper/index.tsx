import clsx from 'clsx';
import { DetailedHTMLProps, useMemo, useRef, useState } from 'react';
import IconRcClose from '@/../assets/icons/common/close.svg?rc';

export const DeleteWrapper = (
  props: DetailedHTMLProps<
    React.HTMLAttributes<HTMLDivElement>,
    HTMLDivElement
  > & {
    onCancelDelete: React.MouseEventHandler<HTMLDivElement>;
    onConfirmDelete: React.MouseEventHandler<HTMLDivElement>;
    showClose?: boolean;
    closeStyle?: React.CSSProperties;
    closeClassName?: string;
    timeout?: number;
  }
) => {
  const {
    closeStyle,
    closeClassName,
    children,
    onCancelDelete: onClose,
    onConfirmDelete,
    showClose,
    className,
    timeout = 150,
    ...other
  } = props;

  const style = useMemo(
    () => ({
      width: '100%',
      height: '100%',
      ...closeStyle,
    }),
    [closeStyle]
  );
  const [hidden, setHidden] = useState(false);

  const lockRef = useRef(false);
  const confirmDelete: React.MouseEventHandler<HTMLDivElement> = (e) => {
    if (lockRef.current) {
      return;
    }
    lockRef.current = true;
    setHidden(true);
    if (timeout) {
      setTimeout(() => onConfirmDelete(e), timeout);
    } else {
      onConfirmDelete(e);
    }
  };
  return (
    <div
      className={clsx(
        className,
        showClose && 'transition-transform transform duration-150',
        hidden ? 'transition-transform overflow-hidden scale-0 "' : 'scale-100'
      )}
      {...other}
    >
      {children}
      <div
        style={style}
        className={clsx(
          ' text-white cursor-pointer absolute top-0 right-0  flex  items-center group h-full w-full bg-[#000] rounded-[6px] overflow-hidden',
          closeClassName,
          showClose ? 'flex' : 'hidden'
        )}
      >
        <div
          onClick={confirmDelete}
          className=" flex-1 h-full flex items-center justify-center bg-[#000] hover:bg-white hover:bg-opacity-10"
        >
          Confirm delete
        </div>
        <div className=" group-hover:hidden h-[calc(100%-16px)] absolute top-8 right-[74px] w-1  bg-white bg-opacity-20" />
        <div
          onClick={onClose}
          className="w-[74px] h-full flex items-center justify-center bg-[#000] hover:bg-white hover:bg-opacity-10"
        >
          <IconRcClose className="text-[10px]" />
        </div>
      </div>
    </div>
  );
};
