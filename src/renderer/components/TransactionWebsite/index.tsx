import { formatDappURLToShow, makeDappURLToOpen } from '@/isomorphic/dapp';
import { useMatchDappByOrigin } from '@/renderer/hooks/useDappsMngr';
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
  const dapp = useMatchDappByOrigin(makeDappURLToOpen(_origin));
  const dappOrigin = dapp?.origin || _origin;

  const handleClick: React.MouseEventHandler<HTMLAnchorElement> = useCallback(
    (e) => {
      e.preventDefault();
      e.stopPropagation();
      openDapp(dappOrigin);
    },
    [openDapp, dappOrigin]
  );

  const url = formatDappURLToShow(
    dapp?.type === 'localfs' ? dapp.id : dappOrigin
  );

  if (!dapp || !dapp.alias) {
    return (
      <a href={dappOrigin} className={className} onClick={handleClick}>
        {url}
      </a>
    );
  }
  return (
    <Tooltip title={url} overlayStyle={{ maxWidth: 200 }}>
      <a href={dappOrigin} className={className} onClick={handleClick}>
        {dapp.alias}
      </a>
    </Tooltip>
  );
};
