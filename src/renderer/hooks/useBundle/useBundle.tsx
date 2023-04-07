import React from 'react';
import { useBundleState } from './useBundleState';

const BundleStateContext = React.createContext<
  ReturnType<typeof useBundleState>
>({} as ReturnType<typeof useBundleState>);

export const BundleStateProvider: React.FC<any> = ({ children }) => {
  const Bundle = useBundleState();

  return (
    <BundleStateContext.Provider value={Bundle}>
      {children}
    </BundleStateContext.Provider>
  );
};

export const useBundle = () => React.useContext(BundleStateContext);
