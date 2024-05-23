import { atom, useAtomValue, useSetAtom } from 'jotai';
import { useCallback, useLayoutEffect, useMemo, useRef } from 'react';

type Modals = {
  modalInSend: boolean;
};
const mainWindowHasModalShownAtom = atom<Modals>({
  modalInSend: false,
});

export function useMainWindowModalShown() {
  const modalsShown = useAtomValue(mainWindowHasModalShownAtom);
  const anyModalShown = useMemo(() => {
    return Object.values(modalsShown).some(Boolean);
  }, [modalsShown]);

  return {
    modalsShown,
    anyModalShown,
  };
}

export function useToggleMainWindowModalShown() {
  const setMainWindowHasModalShown = useSetAtom(mainWindowHasModalShownAtom);

  const toggleMainWindowModalShown = useCallback(
    (type: keyof Modals, nextShownRecord: boolean) => {
      setMainWindowHasModalShown((prev) => {
        return {
          ...prev,
          [type]: nextShownRecord,
        };
      });
    },
    [setMainWindowHasModalShown]
  );

  return {
    toggleMainWindowModalShown,
  };
}

export function useMainWindowModalShownFor(
  type: keyof Modals,
  deps: any[] = []
) {
  const { toggleMainWindowModalShown } = useToggleMainWindowModalShown();

  useLayoutEffect(() => {
    const anyModalShown = deps.some(Boolean);

    toggleMainWindowModalShown(type, anyModalShown);
  }, [toggleMainWindowModalShown, type, deps]);
}
