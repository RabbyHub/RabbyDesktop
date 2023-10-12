import React from 'react';

import clsx from 'clsx';
import { useCheckNewRelease } from '@/renderer/hooks/useAppUpdator';
import styles from './index.module.less';

import RcIconUpdate from './icons/update.svg?rc';
// import RcChevronRight from './icons/chevron-right.svg?rc';
import {
  ModalUpdateOnLock,
  useShowModalUpdateOnLock,
} from './ModalUpdateOnLock';

export default function UpdateTipBar({
  className,
}: React.PropsWithoutRef<{
  className?: string;
}>) {
  const { shouldAlertUpgrade } = useCheckNewRelease();

  const { setIsShowModalUpdateOnLock } = useShowModalUpdateOnLock();

  if (!shouldAlertUpgrade) return null;

  return (
    <>
      <div
        className={clsx(styles.UpdateTipBar, 'font-normal', className)}
        onClick={() => {
          setIsShowModalUpdateOnLock(true);
        }}
      >
        <div className="flex items-center">
          <RcIconUpdate className="w-[16px] h-[16px]" />
          <span className="ml-[8px]">Update to New Version</span>
        </div>

        {/* <RcChevronRight className="w-[20px] h-[20px]" /> */}
      </div>

      <ModalUpdateOnLock />
    </>
  );
}
