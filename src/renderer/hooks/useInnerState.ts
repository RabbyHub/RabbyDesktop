import { useLayoutEffect, useEffect, useState } from 'react';

export const useInnerState = <S>(state: S | (() => S)) => {
  const [_state, setState] = useState(state);

  useEffect(() => {
    setState(state);
  }, [state]);

  return [_state, setState] as const;
};
