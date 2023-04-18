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
  }
) => {
  const {
    hoverTips,
    clickTips,
    timeOut = 3000,
    size,
    iconClassName,
    children,
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
  const [clicked, setClicked] = useState<boolean | undefined>();

  const timerRef = useRef<NodeJS.Timeout>();

  const handleClick = useCallback(() => {
    setClicked(true);
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setClicked(false);
      setClicked(undefined);
    }, timeOut);
  }, [timeOut]);

  useEffect(() => () => clearTimeout(timerRef.current), []);

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

  return (
    <Tooltip
      mouseEnterDelay={0.1}
      open={clicked}
      trigger={trigger}
      title={clicked ? clickTips : hoverTips}
      {...others}
    >
      {child}
    </Tooltip>
  );
};
