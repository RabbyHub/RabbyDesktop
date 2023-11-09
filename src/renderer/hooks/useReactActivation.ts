import { useState } from 'react';
import { useActivate, useUnactivate } from 'react-activation';

/**
 * @description notice: this hooks is ONLY valid for the react component under context of
 * `react-activation`
 */
export function useComponentIsActive() {
  const [isActivate, setIsActivate] = useState(true);

  useUnactivate(() => {
    setIsActivate(false);
  });

  useActivate(() => {
    setIsActivate(true);
  });

  return {
    isActivate,
  };
}
