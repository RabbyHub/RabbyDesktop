import { Modal } from 'antd';
import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import style from './index.module.less';
import { RCIconDappsModalClose } from '../../../../../../assets/icons/internal-homepage';

export const ReleaseNote = () => {
  const [isFirstOpen, setIsFirstOpen] = useState(false);
  // todo: 判断当前版本是否第一打开，且有更新日志。如果是，则显示更新日志。更新日志建议保存为单独的 markdown 文件。

  return (
    <Modal
      className={style.releaseNoteModal}
      open={isFirstOpen}
      centered
      width={800}
      footer={null}
      closeIcon={<RCIconDappsModalClose />}
      onCancel={() => {
        setIsFirstOpen(false);
      }}
    >
      <div className={style.releaseNoteModalTitle}>What’s New?</div>
      <div className={style.releaseNote}>
        <ReactMarkdown remarkPlugins={[remarkGfm]}>
          {`
### 1.Don't just process words - build documents 

Craft brings structure to
your documents - and gives you the tools and freedom to do it your
way. Seamlessly combine images, text, media or tables for the perfect
experience.Drive deep understanding and engagement by allowing the
reader to consume your document just as they would a website.Add your
brand and personal touches on top for the prefect document. 

### 2.Big on impact, teensy weensy on effort 

Organizing your workflow, writing your report, creating your code or mapping your masterplan; whatever you’re
doing, the freedom to do it your way matters.Tables, toggles, markdown
and blocks, back-linking, forward-thinking, in, out and shake it all
about - Craft’s ingeniously rich feature-set gives you endless
possibilities to love how you work.Just click and create for amazingly
beautiful docs in minutes, then bring it all together in your own
unique way. 

### 3.One beautiful experience. 

All of your devices At yourdesk, on the go, on or offline, enjoy Craft’s powerful performance and
legendary UI across your entire toolkit, courtesy of the native app
experience.`}
        </ReactMarkdown>
      </div>
    </Modal>
  );
};
