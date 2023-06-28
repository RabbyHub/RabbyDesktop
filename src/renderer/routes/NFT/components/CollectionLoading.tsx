import { Skeleton } from 'antd';
import React from 'react';

export const CollectionListSkeleton: React.FC = () => {
  return (
    <div className="mt-20 flex flex-col gap-16">
      {Array.from({ length: 4 }).map(() => (
        <Skeleton.Input
          active
          style={{
            width: 600,
            height: 152,
          }}
          className="rounded-6px"
        />
      ))}
    </div>
  );
};
