import { MutableRefObject, useEffect, useRef } from "react"

export default function useMountedEffect <
  T extends (isMountedRef: MutableRefObject<boolean>) => any
> (effect?: T, deps: any[] = []) {
  const isMounted = useRef(false)

  useEffect(() => {
    isMounted.current = true;

    effect?.(isMounted);

    return () => {
      isMounted.current = false;
    }
  }, [...deps])

  return isMounted
}
