import { useEffect, useRef, useState } from 'react';
import { useInterval } from 'react-use';

export default function LoadingDots({
  className,
  dotSize = 3,
  disabled = false,
  interval = 300,
}: React.PropsWithChildren<{
  className?: string;
  disabled?: boolean;
  dotSize?: number;
  interval?: number;
}>) {
  const [dotCount, setDotCount] = useState(0);
  const disabledRef = useRef(disabled);

  useEffect(() => {
    disabledRef.current = disabled;
  }, [disabled]);

  useInterval(() => {
    setDotCount((prev) => {
      if (disabledRef.current) return dotSize;

      return prev < dotSize ? prev + 1 : 0;
    });
  }, interval);

  return (
    <span className={className}>
      {new Array(dotCount).fill(undefined).map((_) => '.')}
    </span>
  );
}
