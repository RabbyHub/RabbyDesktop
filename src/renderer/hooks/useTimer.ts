import { useEffect, useRef, useState } from 'react';

export function useInterval(callback: () => any, delay: number) {
  const savedCallback = useRef<typeof callback>();

  // Remember the latest callback.
  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  // Set up the interval.
  useEffect(() => {
    function tick() {
      savedCallback.current?.();
    }

    if (delay !== null) {
      const id = setInterval(tick, delay);
      return () => clearInterval(id);
    }
  }, [delay]);
}

export function useIntervalValue<T>(value: T, delay: number) {
  const [state, setState] = useState(value);

  useInterval(() => {
    setState(value);
  }, delay);

  return state;
}
