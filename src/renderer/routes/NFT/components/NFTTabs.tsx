import clsx from 'clsx';

type NFTTabsProps = {
  tabs: { id: string; label: React.ReactNode }[];
  activeId: string;
  onClick: (s: string) => void;
};
export const NFTTabs = (props: NFTTabsProps) => {
  const { tabs, activeId = tabs[0].id, onClick } = props;
  return (
    <div className="w-min flex items-center p-4 bg-white bg-opacity-20 rounded-[6px]">
      {tabs.map((tab) => (
        <div
          key={tab.id}
          className={clsx(
            'w-[120px] h-32 rounded-[3px] text-center text-[15px] font-medium flex items-center justify-center cursor-pointer',
            activeId === tab.id
              ? 'bg-[#000] bg-opacity-20 text-white'
              : 'text-white text-opacity-80'
          )}
          onClick={() => {
            if (activeId === tab.id) return;
            onClick(tab.id);
          }}
        >
          {tab.label}
        </div>
      ))}
    </div>
  );
};
