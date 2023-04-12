import { formatTimeReadable } from '@/renderer/utils/time';
import clsx from 'clsx';
import React from 'react';
import { useInterval } from 'react-use';

export interface Props {
  loading: boolean;
  onUpdate: () => void;
}

export const UpdateButton: React.FC<Props> = ({ loading, onUpdate }) => {
  const [now, setNow] = React.useState(0);
  const [updateAt, setUpdateAt] = React.useState(0);

  useInterval(() => {
    setNow(Math.floor(Date.now() / 1000));
  }, 1000);

  React.useEffect(() => {
    setNow(Math.floor(Date.now() / 1000));
  }, []);

  React.useEffect(() => {
    if (!loading) {
      const n = Date.now() - 1000;
      setUpdateAt(Math.floor(n / 1000));
    }
  }, [loading]);

  const handleClickRefresh = (e: React.MouseEvent<HTMLImageElement>) => {
    e.stopPropagation();
    onUpdate();
    setUpdateAt(0);
  };

  return (
    <div
      className={clsx('text-[12px] text-[#ffffff99] cursor-pointer')}
      onClick={handleClickRefresh}
    >
      {loading || updateAt === 0 ? (
        'Updating data'
      ) : (
        <>
          Data updated
          <span className="text-white mx-[4px]">
            {formatTimeReadable(now - updateAt)}
          </span>
          ago
        </>
      )}
      <img
        src="rabby-internal://assets/icons/home/asset-update.svg"
        className={clsx('w-[12px] h-[12px] ml-[9px]', {
          'animate-spin': loading,
        })}
      />
    </div>
  );
};
