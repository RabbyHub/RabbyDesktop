import { Skeleton } from 'antd';

const loadingItem = [
  {
    width: '22%',
    children: () => (
      <div className="flex items-center gap-16">
        <Skeleton.Input
          active
          style={{
            width: '24px',
            height: '24px',
            borderRadius: '99999px',
          }}
        />
        <Skeleton.Input
          active
          style={{
            width: '92px',
            height: '20px',
            borderRadius: '2px',
          }}
        />
      </div>
    ),
  },
  {
    width: '16%',
    children: () => (
      <Skeleton.Input
        active
        style={{
          width: '98px',
          height: '20px',
          borderRadius: '2px',
        }}
      />
    ),
  },
  {
    width: '22%',
    children: () => (
      <Skeleton.Input
        active
        style={{
          width: '158px',
          height: '20px',
          borderRadius: '2px',
        }}
      />
    ),
  },
  {
    width: '16%',
    children: () => (
      <Skeleton.Input
        active
        style={{
          width: '94px',
          height: '20px',
          borderRadius: '2px',
        }}
      />
    ),
  },
  {
    width: '24%',
    children: () => (
      <Skeleton.Input
        active
        style={{
          width: '205px',
          height: '44px',
          borderRadius: '4px',
        }}
      />
    ),
  },
];

export const SummaryLoading = () => (
  <div className="px-14">
    {Array(8)
      .fill(0)
      .map(() => (
        <div className="flex items-center">
          {loadingItem.map((item) => (
            <div
              className="flex items-center h-[64px]"
              style={{
                width: item.width,
              }}
            >
              {item.children()}
            </div>
          ))}
        </div>
      ))}
  </div>
);
