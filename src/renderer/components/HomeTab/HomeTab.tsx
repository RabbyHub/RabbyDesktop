import clsx from 'clsx';
import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const Tab: React.FC<{
  name: string;
  to: string;
}> = ({ name, to }) => {
  const navigateTo = useNavigate();
  const location = useLocation();

  const active = location.pathname === to;

  return (
    <div
      className={clsx(
        'pb-[10px] cursor-pointer mb-[-1px] z-10',
        'text-[18px] hover:opacity-100',
        active ? 'opacity-100 font-bold' : 'font-medium opacity-60',
        {
          'border-b-2 border-t-0 border-l-0 border-r-0 border-solid border-[#FFFFFF33]':
            active,
        }
      )}
      onClick={() => {
        navigateTo(to);
      }}
    >
      {name}
    </div>
  );
};

export const HomeTab: React.FC = () => {
  return (
    <nav
      className={clsx(
        'flex space-x-[38px] items-center',
        'border-t-0 border-l-0 border-r-0 border-b border-solid border-[#FFFFFF0D]',
        'mb-[44px]',
        'text-white'
      )}
    >
      <Tab name="Current" to="/mainwin/home" />
      <Tab name="My Portfolio" to="/mainwin/home/bundle" />
    </nav>
  );
};
