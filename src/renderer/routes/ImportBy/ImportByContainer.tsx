import { walletController } from '@/renderer/ipcRequest/rabbyx';
import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const ImportByContainer: React.FC<any> = ({ children }) => {
  const nav = useNavigate();
  const location = useLocation();

  React.useEffect(() => {
    walletController.isBooted().then((result) => {
      if (!result) {
        nav(`/welcome/import/set-password?from=${location.pathname}`, {
          replace: true,
        });
      }
    });
  }, [nav, location]);

  return children;
};

export default ImportByContainer;
