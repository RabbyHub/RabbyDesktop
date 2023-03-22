import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import clsx from 'clsx';
import { Button } from 'antd';

import '@/renderer/css/style.less';
import '@/renderer/css/windicss';
import '@/renderer/utils/rendererReport';

import RabbyInput from '@/renderer/components/AntdOverwrite/Input';
import { TitlebarForAlertWindow } from '@/renderer/components/Titlebar';

import { parseQueryString } from '@/isomorphic/url';
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

    initedRef.current = true;
    window.rabbyDesktop.ipcRenderer
      .invoke('__internal_rpc:app:prompt-query', promptId)
      .then((res) => {
        if (res.error) return;

        setInitContent({
          title: res.data?.message || '',
          originSite: res.data?.originSite || '',
        });
        setUserInput(res.data?.initInput || '');
      });
  }, []);

  if (!promptId) return null;

  const disableOp = !initedRef.current;

  return (
    <>
      <TitlebarForAlertWindow />
      <div className={styles.AlertWindowPrompt}>
        <div className={styles.PromptInner}>
          <div className={clsx(styles.AlertWindowPrompt__content__body__text)}>
            <p className={clsx('mb-4px')}>
              Page At
              <b className={styles.originSite}>{initContent.originSite}</b>
              says:
            </p>
            <p className={clsx('mb-4px', styles.messageContent)}>
              {initContent.title}
            </p>
            <div>
              <RabbyInput
                disabled={disableOp}
                onChange={(evt) => {
                  setUserInput(evt.target.value);
                }}
                value={userInput}
                maxLength={100}
              />
            </div>
          </div>

          <div
            className={clsx(
              styles.AlertWindowPrompt__content__body__buttons,
              'flex align-items justify-center mt-[24px]'
            )}
          >
            <Button
              type="primary"
              disabled={disableOp}
              ghost
              className={clsx(
                styles.AlertWindowPrompt__content__body__buttons__cancel,
                'w-[100%]'
              )}
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
              className={clsx(
                styles.AlertWindowPrompt__content__body__buttons__confirm,
                'w-[100%]'
              )}
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
