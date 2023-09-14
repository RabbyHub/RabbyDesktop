import classNames from 'classnames';
import { useMatches } from 'react-router-dom';
import styles from './index.module.less';
import ActiveWebviewTag from './components/ActiveWebviewTag';

export function DappViewWrapper({
  children,
}: // eslint-disable-next-line @typescript-eslint/ban-types
React.PropsWithChildren<{}>) {
  const matches = useMatches();

  const firstMatch = matches[0];

  const dappId = firstMatch?.params?.dappId;

  return (
    <div className={styles.dappViewWrapper}>
      {children || null}
      <div className={classNames(styles.dappViewGasket)}>
        <ActiveWebviewTag dappId={dappId} />
      </div>
    </div>
  );
}
