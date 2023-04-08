import { useOpenDapp } from '@/renderer/utils/react-router';
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

  const handleClick: React.MouseEventHandler<HTMLAnchorElement> = useCallback(
    (e) => {
      e.preventDefault();
      e.stopPropagation();
      openDapp(origin);
    },
    [openDapp, origin]
  );

  return (
    <a href={origin} className={className} onClick={handleClick}>
      {domain}
    </a>
  );
};
