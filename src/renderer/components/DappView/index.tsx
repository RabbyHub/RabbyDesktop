import classNames from 'classnames';
import { useMatches } from 'react-router-dom';
import { useWindowTabs } from '@/renderer/hooks-shell/useWindowTabs';
import styles from './index.module.less';
import TabWebview from './components/TabWebview';

export function DappViewWrapper({
  children,
}: // eslint-disable-next-line @typescript-eslint/ban-types
React.PropsWithChildren<{}>) {
  const matches = useMatches();

  const firstMatch = matches[0];

  const dappId = firstMatch?.params?.dappId;

  const { tabsGroupById } = useWindowTabs();

  return (
    <div className={styles.dappViewWrapper}>
      {children || null}
      <div className={classNames(styles.dappViewGasket)}>
        <TabWebview dappId={dappId} />
      </div>
    </div>
  );
}
