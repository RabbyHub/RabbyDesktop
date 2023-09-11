import { requestResetApp } from '@/renderer/ipcRequest/app';

import { Button, Slider, Tooltip, message } from 'antd';
import { useSettings } from '@/renderer/hooks/useSettings';
import {
  DAPP_ZOOM_VALUES,
  IS_RUNTIME_PRODUCTION,
} from '@/isomorphic/constants';
import { forwardMessageTo } from '@/renderer/hooks/useViewsMessage';
import { atom, useAtom } from 'jotai';
import styles from './index.module.less';
import { useIsViewingDevices } from './settingHooks';
import ModalDevices from './components/ModalDevices';
import { testRequestDevice } from './components/ModalDevices/useFilteredDevices';

import { ItemText, ItemAction, ItemSwitch } from './SettingArtifacts';

const debugStateAtom =
  atom<IDebugStates['isGhostWindowDebugHighlighted']>(false);
function DeveloperKitsParts() {
  const [isGhostWindowDebugHighlighted, setIsGhostWindowDebugHighlighted] =
    useAtom(debugStateAtom);

  const { setIsViewingDevices } = useIsViewingDevices();
  const { settings, adjustDappViewZoomPercent } = useSettings();

  if (IS_RUNTIME_PRODUCTION) return null;

  return (
    <>
      <div className={styles.settingBlock}>
        <h4 className={styles.blockTitle}>Developer Kits</h4>
        <div className={styles.itemList}>
          <ItemAction
            name="Devices"
            icon="rabby-internal://assets/icons/developer-kits/usb.svg"
            onClick={() => {
              setIsViewingDevices(true);
            }}
          >
            <Button
              type="primary"
              ghost
              onClick={(evt) => {
                evt.stopPropagation();
                testRequestDevice();
              }}
            >
              <code>hid.requestDevices()</code>
            </Button>
          </ItemAction>
          <ItemAction
            name="Camera"
            icon="rabby-internal://assets/icons/developer-kits/camera.svg"
          >
            <Button
              type="primary"
              ghost
              className="mr-[8px]"
              onClick={(evt) => {
                evt.stopPropagation();
                window.rabbyDesktop.ipcRenderer
                  .invoke('start-select-camera')
                  .then((result) => {
                    if (result.isCanceled) {
                      message.info('User Canceled');
                    } else {
                      message.success(
                        `[${result.selectId}] Selected camera with ID: ${result.constrains?.label}`
                      );
                    }
                  });
              }}
            >
              <code>Query Selected Camera</code>
            </Button>
            <Button
              type="primary"
              ghost
              className="mr-[8px]"
              onClick={(evt) => {
                evt.stopPropagation();
                window.rabbyDesktop.ipcRenderer
                  .invoke('start-select-camera', { forceUserSelect: true })
                  .then((result) => {
                    if (result.isCanceled) {
                      message.info('User Canceled');
                    } else {
                      message.success(
                        `[${result.selectId}] Selected camera with ID: ${result.constrains?.label}`
                      );
                    }
                  });
              }}
            >
              <code>Force Select Camera</code>
            </Button>
          </ItemAction>
          <ItemSwitch
            checked={isGhostWindowDebugHighlighted}
            icon="rabby-internal://assets/icons/developer-kits/ghost.svg"
            name={
              <>
                <div>
                  <Tooltip
                    trigger="hover"
                    title={
                      <>
                        <ul className="pl-[8px] pt-[8px]">
                          <li>
                            Ghost window ONLY visible if there's element need to
                            be rendered, otherwise it will be hidden by set
                            opacity to 0.
                          </li>
                          <li className="mt-[8px]">
                            On development, you can enable this option to make
                            it highlighted with light blue background.
                          </li>
                        </ul>
                      </>
                    }
                  >
                    <span className="text-14 font-medium">
                      Toggle Ghost Window Highlight
                      <img
                        className="ml-[4px] w-[18px] h-[18px] inline-block"
                        src="rabby-internal://assets/icons/mainwin-settings/info.svg"
                        alt=""
                      />
                    </span>
                  </Tooltip>
                </div>
              </>
            }
            onChange={(nextEnabled: boolean) => {
              setIsGhostWindowDebugHighlighted(nextEnabled);
              forwardMessageTo('top-ghost-window', 'debug:toggle-highlight', {
                payload: {
                  isHighlight: nextEnabled,
                },
              });
            }}
          />
          <ItemAction
            name={<span className={styles.dangerText}>Reset App</span>}
            icon="rabby-internal://assets/icons/mainwin-settings/reset.svg"
            onClick={() => {
              requestResetApp();
            }}
          />
          <ItemAction
            name={<span className={styles.dangerText}>Reset Signs</span>}
            icon="rabby-internal://assets/icons/mainwin-settings/reset.svg"
            onClick={() => {
              window.rabbyDesktop.ipcRenderer.sendMessage(
                '__internal_rpc:app:reset-rabbyx-approvals'
              );
            }}
          />

          <ItemText
            name="Dapp Zoom Ratio"
            icon="rabby-internal://assets/icons/mainwin-settings/icon-dapp-zoom.svg"
          >
            <Slider
              className="w-[300px]"
              value={settings.experimentalDappViewZoomPercent}
              marks={{
                [DAPP_ZOOM_VALUES.MIN_ZOOM_PERCENT]: {
                  style: { color: '#fff', fontSize: 12 },
                  label: `${DAPP_ZOOM_VALUES.MIN_ZOOM_PERCENT}%`,
                },
                [DAPP_ZOOM_VALUES.DEFAULT_ZOOM_PERCENT]: {
                  style: { color: '#fff', fontSize: 12 },
                  label: `${DAPP_ZOOM_VALUES.DEFAULT_ZOOM_PERCENT}%`,
                },
                [DAPP_ZOOM_VALUES.MAX_ZOOM_PERCENT]: {
                  style: { color: '#fff', fontSize: 12 },
                  label: `${DAPP_ZOOM_VALUES.MAX_ZOOM_PERCENT}%`,
                },
              }}
              tooltip={{
                formatter: (value) => `${value}%`,
              }}
              min={DAPP_ZOOM_VALUES.MIN_ZOOM_PERCENT}
              max={DAPP_ZOOM_VALUES.MAX_ZOOM_PERCENT}
              onChange={(value) => {
                adjustDappViewZoomPercent(value);
              }}
            />
          </ItemText>
        </div>
      </div>
      <ModalDevices />
    </>
  );
}

export function MainWindowSettingsDeveloperKits() {
  return (
    <div className={styles.settingsPage}>
      <div className={styles.settingItems}>
        <DeveloperKitsParts />
      </div>
    </div>
  );
}
