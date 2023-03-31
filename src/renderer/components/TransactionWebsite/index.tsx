import { useDapp, useMatchDapp } from '@/renderer/hooks/useDappsMngr';
import { useOpenDapp } from '@/renderer/utils/react-router';
import { Tooltip } from 'antd';
import { useCallback } from 'react';

interface TransactionWebsiteProps {
  className?: string;
  origin: string;
}
export const TransactionWebsite = ({
  origin,
  className,
}: TransactionWebsiteProps) => {
  const domain = origin.replace(/^\w+:\/\//, '');

  const openDapp = useOpenDapp();
  const dapp = useMatchDapp(origin);

  const handleClick: React.MouseEventHandler<HTMLAnchorElement> = useCallback(
    (e) => {
      e.preventDefault();
      e.stopPropagation();
      openDapp(origin);
    },
    [openDapp, origin]
  );

  if (!dapp || !dapp.alias) {
    return (
      <a href={origin} className={className} onClick={handleClick}>
        {domain}
      </a>
    );
  }
  return (
    <Tooltip title={origin} overlayStyle={{ maxWidth: 200 }}>
      <a href={origin} className={className} onClick={handleClick}>
        {dapp.alias}
      </a>
    </Tooltip>
  );
};
