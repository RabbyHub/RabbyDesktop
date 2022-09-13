import { MutableRefObject, useEffect, useRef } from 'react';

export default function useMountedEffect<
  T extends (isMountedRef: MutableRefObject<boolean>) => any
>(effect?: T, deps: any[] = []) {
  const isMounted = useRef(false);
  const depsRef = useRef(deps || []);

  useEffect(() => {
    isMounted.current = true;

    effect?.(isMounted);

    return () => {
      isMounted.current = false;
    };
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, depsRef.current);

  return isMounted;
}
