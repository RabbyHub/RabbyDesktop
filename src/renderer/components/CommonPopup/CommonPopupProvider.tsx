import { ReactNode } from 'react';
import {
  CommonPopupContext,
  useCommonPopupViewState,
} from './useCommonPopupView';
import { CommonPopup } from './CommonPopup';

export const CommonPopupProvider = ({ children }: { children?: ReactNode }) => {
  const commonPopupView = useCommonPopupViewState();

  return (
    <CommonPopupContext.Provider value={{ commonPopupView }}>
      {children}
      <CommonPopup />
    </CommonPopupContext.Provider>
  );
};
