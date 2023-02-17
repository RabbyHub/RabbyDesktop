import { useDapps } from '@/renderer/hooks/useDappsMngr';
import { openExternalUrl } from '@/renderer/ipcRequest/app';
import { useOpenDapp } from '@/renderer/utils/react-router';
import classNames from 'classnames';
import { useCallback, useMemo } from 'react';

interface TransactionWebsiteProps {
  site: ConnectedSite;
  className?: string;
}
export const TransactionWebsite = ({
  site,
  className,
}: TransactionWebsiteProps) => {
  const origin = site.origin;
  const domain = site.origin.replace(/^\w+:\/\//, '');
  // todo: 这里会不会有性能问题？
  const { dapps } = useDapps();

  const isRabby = useMemo(() => {
    return (
      /^chrome-extension:\/\//.test(origin) && site.name === 'Rabby Wallet'
    );
  }, [origin, site.name]);

  const openDapp = useOpenDapp();

  const isDapp = useMemo(() => {
    return !!dapps.find((dapp) => dapp.origin === origin);
  }, [dapps, origin]);

  const handleClick: React.MouseEventHandler<HTMLAnchorElement> = useCallback(
    (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (isRabby) {
        return;
      }
      if (isDapp) {
        openDapp(origin);
        return;
      }
      openExternalUrl(origin);
    },
    [isDapp, isRabby, openDapp, origin]
  );

  if (isRabby) {
    return (
      <span className={classNames('is-rabby', className)}>Rabby Wallet</span>
    );
  }
  return (
    <a href={origin} className={className} onClick={handleClick}>
      {domain}
    </a>
  );
};
