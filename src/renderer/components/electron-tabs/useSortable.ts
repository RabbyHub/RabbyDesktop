import React, { useLayoutEffect, useRef } from 'react';
import Sortable from 'sortablejs';

export default function useSortable (
  sortableOptions: Sortable.Options = {}
) {
  const domRef: React.RefObject<HTMLElement> = useRef<HTMLDivElement | HTMLUListElement | HTMLOListElement>(null);
  useLayoutEffect(() => {
    if (!domRef.current) {
      return ;
    }

    const options = Object.assign({
      direction: "horizontal",
      animation: 150,
      swapThreshold: 0.20,
    }, sortableOptions);
    const vm = new Sortable(domRef.current, options);

    return () => {
      vm.destroy();
    }
  }, [ sortableOptions ]);

  return domRef;
}
