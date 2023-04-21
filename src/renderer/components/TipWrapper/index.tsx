import { Tooltip, TooltipProps } from 'antd';
import { atom, useAtom, useSetAtom } from 'jotai';
import {
  cloneElement,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import IconConfirm from '@/../assets/icons/checkbox/confirm.svg';

const { nanoid } = require('nanoid');

const tipIdAtom = atom('');
const tipTimerAtom = atom<NodeJS.Timeout | undefined>(undefined);
const setTipTimerAtom = atom(null, (get, set, update: [string, number]) => {
  clearTimeout(get(tipTimerAtom));
  set(tipIdAtom, update[0]);
  set(
    tipTimerAtom,
    setTimeout(() => {
      set(tipIdAtom, '');
      set(tipTimerAtom, undefined);
    }, update[1])
  );
});

const mouseEnterAtom = atom(null, (get, set, update: string) => {
  if (!(get(tipIdAtom) === update && get(tipTimerAtom))) {
    set(tipTimerAtom, undefined);
    set(tipIdAtom, update);
  }
});

const mouseLeaveAtom = atom(null, (get, set, update: string) => {
  if (!(get(tipIdAtom) === update && get(tipTimerAtom))) {
    set(tipTimerAtom, undefined);
    set(tipIdAtom, '');
  }
});

export const TipsWrapper = (
  props: TooltipProps & {
    hoverTips?: string;
    clickTips?: string;
    timeOut?: number;
    size?: number;
    iconClassName?: string;
    children: React.ReactElement;
    defaultClicked?: boolean;
    showConfirmIcon?: boolean;
  }
) => {
  const {
    hoverTips,
    clickTips,
    timeOut = 3000,
    size,
    iconClassName,
    children,
    defaultClicked,
    showConfirmIcon = true,
    ...others
  } = props;

  const id = useRef(nanoid());
  const [currentTipsId, setCurrentTipsId] = useAtom(tipIdAtom);
  const setTimer = useSetAtom(setTipTimerAtom);
  const mouseLeave = useSetAtom(mouseLeaveAtom);
  const mouseEnter = useSetAtom(mouseEnterAtom);

  const timerRef = useRef<NodeJS.Timeout>();

  const [clicked, setClicked] = useState<boolean | undefined>(false);

  const handleClick = useCallback(() => {
    setClicked(true);
  }, []);

  const child = useMemo(() => {
    return children
      ? cloneElement(children as React.ReactElement, {
          ...children.props,
          onClick: (...args: any[]) => {
            children?.props?.onClick?.(...args);
            if (clickTips) {
              handleClick();
              setTimer([id.current, timeOut]);
            }
          },
          onMouseEnter: (...args: any[]) => {
            children?.props?.onMouseEnter?.(...args);
            if (hoverTips) {
              mouseEnter(id.current);
            }
          },
          onMouseLeave: (...args: any[]) => {
            children?.props?.onMouseLeave?.(...args);
            if (hoverTips) {
              mouseLeave(id.current);
            }
          },
        })
      : children;
  }, [
    children,
    clickTips,
    handleClick,
    hoverTips,
    mouseEnter,
    mouseLeave,
    setTimer,
    timeOut,
  ]);

  useEffect(() => {
    if (defaultClicked) {
      handleClick();
      setTimer([id.current, timeOut]);
    }
  }, [defaultClicked, handleClick, setTimer, timeOut]);

  useEffect(() => {
    if (currentTipsId !== id.current) {
      setTimeout(() => {
        setClicked(false);
      }, 200);
    }
  }, [currentTipsId]);

  useEffect(
    () => () => {
      clearTimeout(timerRef.current);
    },
    []
  );

  const open = useMemo(() => {
    if (!hoverTips && clickTips) {
      return currentTipsId === id.current && clicked;
    }
    return currentTipsId === id.current;
  }, [clickTips, clicked, currentTipsId, hoverTips]);

  return (
    <Tooltip
      open={open}
      mouseEnterDelay={0.1}
      title={
        <div className="flex items-center gap-4">
          {clicked ? <span>{clickTips}</span> : hoverTips}{' '}
          {clicked && showConfirmIcon && (
            <img src={IconConfirm} className="w-12 h-8" />
          )}
        </div>
      }
      {...others}
    >
      {child}
    </Tooltip>
  );
};
