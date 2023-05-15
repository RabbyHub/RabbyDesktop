import { useMemo, useState } from 'react';
import classNames from 'classnames';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

import {
  useCheckNewRelease,
  useCurrentVersionReleaseNote,
} from '../../../../hooks/useAppUpdator';
import styles from './index.module.less';

import RcInactiveBg from './inactive-bg.svg?rc';
import NoVersionURL from './no-new-version.svg';

interface UpdateAreaProps {
  className?: string;
}
export const UpdateArea = ({ className }: UpdateAreaProps) => {
  const { currentVersionReleaseNote, appVersion } =
    useCurrentVersionReleaseNote();

  const { releaseCheckInfo, fetchLatestReleaseInfo } = useCheckNewRelease();

  const tabs = useMemo(
    () => [
      {
        title: `Current Version: ${appVersion}`,
        key: 'currentVersion' as const,
      },
      {
        title: !releaseCheckInfo.hasNewRelease ? (
          'New Version'
        ) : (
          <span>
            New Version: {releaseCheckInfo.releaseVersion}
            <span className={styles.tabHeadUpdateBadge}>Update</span>
          </span>
        ),
        key: 'lastestVersion' as const,
      },
    ],
    [appVersion, releaseCheckInfo]
  );
  const [activeTab, setActiveTab] = useState(tabs[0].key);

  return (
    <div className={classNames(styles.updateAreaInSettings, className)}>
      <div className={styles.tabHeads}>
        {tabs.map((tab) => {
          const isActive = tab.key === activeTab;
          return (
            <div
              className={classNames(styles.tabItem, isActive && styles.active)}
              onClick={() => {
                if (tab.key === 'lastestVersion') {
                  fetchLatestReleaseInfo().then((releseInfo) => {
                    // message.open({
                    //   type: 'info',
                    //   content: !releseInfo?.hasNewRelease
                    //     ? 'It is the latest version.'
                    //     : 'New version is available',
                    // });
                  });
                }
                setActiveTab(tab.key);
              }}
              key={tab.key}
            >
              <RcInactiveBg className={styles.inactiveBg} />
              {tab.title}
            </div>
          );
        })}
      </div>

      <div className={styles.tabBody}>
        {activeTab === 'currentVersion' && (
          <div className={styles.changeLogContent}>
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {currentVersionReleaseNote || ''}
            </ReactMarkdown>
          </div>
        )}

        {activeTab === 'lastestVersion' &&
          (releaseCheckInfo.hasNewRelease ? (
            <div className={styles.changeLogContent}>
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {releaseCheckInfo.releaseNote || ''}
              </ReactMarkdown>
            </div>
          ) : (
            <div
              className={classNames(
                styles.noNewVersion,
                styles.changeLogContent
              )}
            >
              <img src={NoVersionURL} className="w-[52px] h-[52px]" />
              <span className={styles.noVersionText}>No New Version</span>
            </div>
          ))}
      </div>
    </div>
  );
};
