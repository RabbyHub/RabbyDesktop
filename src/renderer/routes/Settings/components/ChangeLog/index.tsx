import { Button } from 'antd';
import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Modal } from '@/renderer/components/Modal/Modal';
import { useCheckNewRelease } from '@/renderer/hooks/useAppUpdator';
import style from './index.module.less';
import { AutoUpdate } from '../AutoUpdate';

export const ChangeLog = () => {
  const [visible, setVisible] = useState(false);
  const { releaseCheckInfo } = useCheckNewRelease();
  if (!releaseCheckInfo?.hasNewRelease || !releaseCheckInfo?.releaseNote) {
    return null;
  }

  return (
    <>
      <Button
        className={style.changeLogBtn}
        type="primary"
        ghost
        size="large"
        onClick={(e) => {
          e.stopPropagation();
          setVisible(true);
        }}
      >
        <img
          src="rabby-internal://assets/icons/change-log/icon-change-log.svg"
          alt=""
        />
        View Release Note
      </Button>
      <Modal
        className={style.changeLogModal}
        open={visible}
        onCancel={() => setVisible(false)}
        centered
        width={480}
        footer={null}
      >
        <header className={style.changeLogHeader}>
          <div className={style.changeLogTitle}>New Version</div>
          <div className={style.changeLogVersion}>
            {releaseCheckInfo.releaseVersion}
          </div>
        </header>
        <div className={style.changeLogContent}>
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {releaseCheckInfo?.releaseNote || ''}
          </ReactMarkdown>
        </div>
        <footer className={style.changeLogFooter}>
          <AutoUpdate className={style.autoUpdate} />
        </footer>
      </Modal>
    </>
  );
};
