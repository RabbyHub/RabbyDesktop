import { arraify } from '@/isomorphic/array';
import {
  MutableRefObject,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
} from 'react';

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

export function useBodyClassNameOnMounted(
  className: ItOrItsArray<string | string | number | boolean>
) {
  const classNames = useMemo(() => {
    return arraify(className).filter(Boolean).join(' ');
  }, [className]);

  useLayoutEffect(() => {
    classNames.split(' ').forEach((name) => {
      document.body.classList.add(name);
    });

    return () => {
      classNames.split(' ').forEach((name) => {
        document.body.classList.remove(name);
      });
    };
  }, [classNames]);
}
