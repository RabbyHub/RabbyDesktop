import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { walletController } from '../ipcRequest/rabbyx';

export const RequireUnlock: React.FC<any> = ({ children }) => {
  const location = useLocation();
  const nav = useNavigate();

  const checkAuth = React.useCallback(async () => {
    const isBooted = await walletController.isBooted();
    const isUnlock = await walletController.isUnlocked();

    if (!isBooted) {
      return nav('/welcome/getting-started', {
        replace: true,
      });
    }

    if (!isUnlock) {
      return nav(`/unlock?from=${location.pathname}`, {
        replace: true,
      });
    }

    return null;
  }, [location.pathname, nav]);

  React.useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return children;
};
