import { formatDappURLToShow, makeDappURLToOpen } from '@/isomorphic/dapp';
import { useMatchDapp } from '@/renderer/hooks/useDappsMngr';
import { useOpenDapp } from '@/renderer/utils/react-router';
import { Tooltip } from 'antd';
import { useCallback } from 'react';

interface TransactionWebsiteProps {
  className?: string;
  origin: string;
}
export const TransactionWebsite = ({
  origin: _origin,
  className,
}: TransactionWebsiteProps) => {
  const openDapp = useOpenDapp();
  const origin = makeDappURLToOpen(_origin);
  const dapp = useMatchDapp(origin);

  const handleClick: React.MouseEventHandler<HTMLAnchorElement> = useCallback(
    (e) => {
      e.preventDefault();
      e.stopPropagation();
      openDapp(origin);
    },
    [openDapp, origin]
  );

  const url = formatDappURLToShow(origin);

  if (!dapp || !dapp.alias) {
    return (
      <a href={origin} className={className} onClick={handleClick}>
        {url}
      </a>
    );
  }
  return (
    <Tooltip title={url} overlayStyle={{ maxWidth: 200 }}>
      <a href={origin} className={className} onClick={handleClick}>
        {dapp.alias}
      </a>
    </Tooltip>
  );
};
