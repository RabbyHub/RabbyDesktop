import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const ImportByContainer: React.FC<any> = ({ children }) => {
  const nav = useNavigate();
  const location = useLocation();

  // todo: check password is set
  React.useEffect(() => {
    if (false) {
      nav(`/import/set-password?from=${location.pathname}`, { replace: true });
    }
  }, [nav, location]);

  return children;
};

export default ImportByContainer;
