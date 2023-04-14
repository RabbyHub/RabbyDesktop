import {
  UpdateButton,
  Props as UpdateButtonProps,
} from '@/renderer/components/UpdateButton';
import { atom, useAtom } from 'jotai';
import React from 'react';
import { useInterval } from 'react-use';

type Props = Omit<UpdateButtonProps, 'updateAt'>;

const updateAtAtom = atom(0);
export const BundleUpdateButton: React.FC<Props> = ({ loading, onUpdate }) => {
  const [updateAt, setUpdateAt] = useAtom(updateAtAtom);

  React.useEffect(() => {
    if (!loading) {
      const time = Math.floor((Date.now() - 1000) / 1000);
      setUpdateAt((prev) => {
        return prev === 0 ? time : prev;
      });
    }
  }, [loading, setUpdateAt]);

  useInterval(() => {
    // 如果更新时间过期 1h 则自动触发更新
    if (updateAt !== 0 && Date.now() / 1000 - updateAt > 3600) {
      onUpdate();
      setUpdateAt(0);
    }
  }, 1000);

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
