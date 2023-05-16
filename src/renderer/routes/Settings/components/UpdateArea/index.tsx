import React, { useMemo, useState } from 'react';
import classNames from 'classnames';
import { message } from 'antd';

// @ts-expect-error
import ReactMarkdown from 'react-markdown';
// @ts-expect-error
import remarkGfm from 'remark-gfm';

import { detectClientOS } from '@/isomorphic/os';
import ChangeLogContent from '@/renderer/components/ChangeLogContent';
import {
  useCheckNewRelease,
  useCurrentVersionReleaseNote,
} from '../../../../hooks/useAppUpdator';
import styles from './index.module.less';

import inactiveBg from './inactive-bg.svg';
import NoVersionURL from './no-new-version.svg';
import UpdateAndVerify from '../UpdateAndVerify';

const osType = detectClientOS();

interface UpdateAreaProps {
  className?: string;
}
export const UpdateArea = ({ className }: UpdateAreaProps) => {
  const {
    copyCurrentVersionInfo,
    currentVersionReleaseNote,
    versionTextToShow,
  } = useCurrentVersionReleaseNote();

  const { releaseCheckInfo, fetchLatestReleaseInfo } = useCheckNewRelease();

  const tabs = useMemo(
    () => [
      {
        title: `Current Version: ${versionTextToShow}`,
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
    [versionTextToShow, releaseCheckInfo]
  );
  const [activeTab, setActiveTab] = useState(tabs[0].key);

  return (
    <div className={classNames(styles.updateAreaInSettings, className)}>
      <div className={styles.tabHeads}>
        {tabs.map((tab, idx) => {
          const isActive = tab.key === activeTab;
          return (
            <React.Fragment key={tab.key}>
              <div
                className={classNames(
                  styles.tabItem,
                  isActive && styles.active
                )}
                onClick={(evt) => {
                  if (tab.key === 'lastestVersion') {
                    fetchLatestReleaseInfo();
                  } else if (tab.key === 'currentVersion') {
                    if (
                      (osType === 'win32' && evt.ctrlKey && evt.altKey) ||
                      (osType === 'darwin' && evt.metaKey && evt.altKey)
                    ) {
                      copyCurrentVersionInfo();
                      message.open({
                        type: 'info',
                        content: 'Copied Version Info',
                      });
                    }
                  }

                  setActiveTab(tab.key);
                }}
              >
                {tab.title}
              </div>
              {idx !== tabs.length - 1 && (
                <div
                  className={styles.splitLine}
                  style={{
                    backgroundImage: `url(${inactiveBg})`,
                  }}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>

      <div className={styles.tabBody}>
        {activeTab === 'currentVersion' && (
          <ChangeLogContent className={styles.changeLogContainer}>
            {currentVersionReleaseNote || ''}
          </ChangeLogContent>
        )}

        {activeTab === 'lastestVersion' &&
          (!releaseCheckInfo.hasNewRelease ? (
            <div
              className={classNames(
                styles.noNewVersion,
                styles.changeLogContainer
              )}
            >
              <img src={NoVersionURL} className="w-[52px] h-[52px]" />
              <span className={styles.noVersionText}>
                No new version available; you are already using the latest
                release.
              </span>
            </div>
          ) : (
            <>
              <ChangeLogContent className={styles.changeLogContainer}>
                {releaseCheckInfo.releaseNote || ''}
              </ChangeLogContent>
              <div className={styles.updateOpLine}>
                <UpdateAndVerify />
              </div>
            </>
          ))}
      </div>
    </div>
  );
};
