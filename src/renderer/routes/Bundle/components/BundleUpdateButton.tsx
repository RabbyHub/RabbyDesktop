import {
  UpdateButton,
  Props as UpdateButtonProps,
} from '@/renderer/components/UpdateButton';
import { useZViewsVisibleChanged } from '@/renderer/hooks/usePopupWinOnMainwin';
import { atom, useAtom } from 'jotai';
import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

type Props = Omit<UpdateButtonProps, 'updateAt'>;

const updateAtAtom = atom(0);
export const BundleUpdateButton: React.FC<Props> = ({ loading, onUpdate }) => {
  const [updateAt, setUpdateAt] = useAtom(updateAtAtom);
  const location = useLocation();

  React.useEffect(() => {
    if (!loading) {
      const time = Math.floor((Date.now() - 1000) / 1000);
      setUpdateAt((prev) => {
        return prev === 0 ? time : prev;
      });
    }
  }, [loading, setUpdateAt]);

  useZViewsVisibleChanged((visibles) => {
    if (
      updateAt !== 0 &&
      Date.now() / 1000 - updateAt > 3600 &&
      location.pathname === '/mainwin/home/bundle' &&
      !Object.values(visibles).some((item) => item) // all closed
    ) {
      onUpdate();
      setUpdateAt(0);
    }
  });

  useEffect(() => {
    if (location.pathname === '/mainwin/home/bundle') {
      if (updateAt !== 0 && Date.now() / 1000 - updateAt > 3600) {
        onUpdate();
        setUpdateAt(0);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location]);

  const handleUpdate = () => {
    onUpdate();
    setUpdateAt(0);
  };

  return (
    <UpdateButton
      onUpdate={handleUpdate}
      updateAt={updateAt}
      loading={loading}
    />
  );
};
