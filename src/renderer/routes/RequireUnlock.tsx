import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useUnlocked } from '../hooks/rabbyx/useUnlocked';

export const RequireUnlock: React.FC<any> = ({ children }) => {
  const location = useLocation();
  const nav = useNavigate();
  const { isUnlocked } = useUnlocked();

  React.useEffect(() => {
    if (!isUnlocked) {
      nav(`/unlock?from=${location.pathname}`, {
        replace: true,
      });
    }
  }, [location.pathname, nav, isUnlocked]);

  return children;
};
