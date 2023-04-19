import { useClickOutSide } from '@/renderer/hooks/useClick';
import useDebounceValue from '@/renderer/hooks/useDebounceValue';
import { Tooltip, TooltipProps } from 'antd';
import {
  cloneElement,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

export const TipsWrapper = (
  props: TooltipProps & {
    hoverTips?: string;
    clickTips?: string;
    timeOut?: number;
    size?: number;
    iconClassName?: string;
    children: React.ReactElement;
    defaultClicked?: true;
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
    ...others
  } = props;
  const trigger = useMemo(() => {
    const arr: TooltipProps['trigger'] = [];
    if (clickTips) {
      arr.push('click');
    }
    if (hoverTips) {
      arr.push('hover');
    }
    return arr;
  }, [clickTips, hoverTips]);

  const divRef = useRef<HTMLDivElement>(null);

  const timerRef = useRef<NodeJS.Timeout>();
  const timer2Ref = useRef<NodeJS.Timeout>();

  const [clicked, setClicked] = useState<boolean | undefined>(defaultClicked);

  const closeClickedTips = useCallback(() => {
    setClicked(undefined);
  }, []);

  const handleClick = useCallback(() => {
    setClicked(true);
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(closeClickedTips, timeOut);
  }, [closeClickedTips, timeOut]);

  const clearTimer = useCallback(() => {
    clearTimeout(timerRef.current);
    clearTimeout(timer2Ref.current);
  }, []);

  const resetState = useCallback(() => {
    clearTimer();
    timerRef.current = setTimeout(() => setClicked(false), timeOut);
    timer2Ref.current = setTimeout(() => setClicked(undefined), timeOut + 100);
  }, [clearTimer, timeOut]);

  const child = useMemo(() => {
    return children && clickTips
      ? cloneElement(children as React.ReactElement, {
          ...children.props,
          onClick: (...args: any[]) => {
            children?.props?.onClick?.(...args);
            handleClick();
          },
        })
      : children;
  }, [children, clickTips, handleClick]);

  useClickOutSide(divRef, closeClickedTips);

  // const debounceClicked = useDebounceValue(clicked, 200);

  useEffect(() => {
    if (clicked) {
      resetState();
    }
  }, [clicked, resetState, timeOut]);

  useEffect(
    () => () => {
      clearTimeout(timerRef.current);
      clearTimeout(timer2Ref.current);
    },
    []
  );

  return (
    <Tooltip
      open={clicked}
      trigger={trigger}
      title={<div ref={divRef}>{clicked ? clickTips : hoverTips}</div>}
      {...others}
    >
      {child}
    </Tooltip>
  );
};
