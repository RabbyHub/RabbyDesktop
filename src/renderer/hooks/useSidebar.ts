import { atom, useAtom } from 'jotai';

const isAnimatingAtom = atom(false);
export function useIsAnimating() {
  const [isAnimating, setIsAnimating] = useAtom(isAnimatingAtom);
  return {
    isAnimating,
    setIsAnimating,
  };
}
