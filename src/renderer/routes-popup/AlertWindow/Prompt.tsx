import { useEffect, useRef, useState } from 'react';
import clsx from 'clsx';
import { Button } from 'antd';

import '@/renderer/css/style.less';
import '@/renderer/css/windicss';
import '@/renderer/utils/rendererReport';

import RabbyInput from '@/renderer/components/AntdOverwrite/Input';

import { parseQueryString } from '@/isomorphic/url';

import './Prompt.less';
import styles from './Prompt.module.less';

const promptId = parseQueryString().__webuiPromptId;

// TODO: support keyup esc to cancel
export default function AlertWindowPrompt() {
  const [initContent, setInitContent] = useState({
    title: '',
    originSite: '',
  });
  const [userInput, setUserInput] = useState('');
  const initedRef = useRef(false);

  useEffect(() => {
    if (initedRef.current) return;

    const dispose = window.rabbyDesktop.ipcRenderer.on(
      '__internal_push:app:prompt-init',
      (res) => {
        if (res.promptId !== promptId) return;

        setInitContent({
          title: res.data?.message || '',
          originSite: res.data?.originSite || '',
        });
        setUserInput(res.data?.initInput || '');
      }
    );

    initedRef.current = true;
    window.rabbyDesktop.ipcRenderer.sendMessage(
      '__internal_rpc:app:prompt-mounted',
      promptId
    );

    return dispose;
  }, []);

  if (!promptId) return null;

  const disableOp = !initedRef.current;

  return (
    <>
      {/* <TitlebarForAlertWindow /> */}
      <div className={styles.AlertWindowPrompt}>
        <div className={styles.PromptInner}>
          <div className={clsx(styles.AlertWindowPromptTitle)}>
            <p className={clsx('mb-4px')}>
              Page At
              <b className={styles.originSite}>{initContent.originSite}</b>
              says:
            </p>
            <p className={clsx('mb-0 h-[40px]', styles.messageContent)}>
              {initContent.title}
            </p>
          </div>

          <div className="mt-0">
            <RabbyInput
              className="prompt-input"
              disabled={disableOp}
              onChange={(evt) => {
                setUserInput(evt.target.value);
              }}
              value={userInput}
              maxLength={100}
            />
          </div>

          <div
            className={clsx(
              styles.AlertWindowPrompt__content__body__buttons,
              'flex align-items justify-center mt-22px'
            )}
          >
            <Button
              type="primary"
              disabled={disableOp}
              ghost
              className={clsx(styles.actionBtn, 'w-[100%]')}
              onClick={() => {
                window.rabbyDesktop.ipcRenderer.sendMessage(
                  '__internal_rpc:app:prompt-cancel',
                  promptId
                );
              }}
            >
              Cancel
            </Button>
            <div className="w-[12px]" />
            <Button
              type="primary"
              disabled={disableOp}
              className={clsx(styles.actionBtn, 'w-[100%]')}
              onClick={() => {
                window.rabbyDesktop.ipcRenderer.sendMessage(
                  '__internal_rpc:app:prompt-confirm',
                  promptId,
                  userInput
                );
              }}
            >
              OK
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
