import { NATIVE_HEADER_H } from '@/isomorphic/const-size';
import { useLayoutEffect } from 'react';

export default function useDragHeadbar() {
  useLayoutEffect(() => {
    const div = document.createElement('div');
    div.className = 'global-dragheadbar';

    div.style.height = `${NATIVE_HEADER_H}px`;

    document.body.appendChild(div);

    return () => {
      document.body.removeChild(div);
    };
  }, []);
}
