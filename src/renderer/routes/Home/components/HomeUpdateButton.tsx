import {
  UpdateButton,
  Props as UpdateButtonProps,
} from '@/renderer/components/UpdateButton';
import React from 'react';

type Props = Omit<UpdateButtonProps, 'updateAt'>;

export const HomeUpdateButton: React.FC<Props> = ({ loading, onUpdate }) => {
  const [updateAt, setUpdateAt] = React.useState(0);

  React.useEffect(() => {
    if (!loading) {
      const n = Date.now() - 1000;
      setUpdateAt(Math.floor(n / 1000));
    }
  }, [loading]);

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
