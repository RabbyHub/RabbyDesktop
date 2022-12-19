/* eslint-disable jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */
import { useClickToPopupDebugMenu } from '@/renderer/hooks/useRegChannelTools';
import { Dropdown, Menu } from 'antd';

export const Footer = ({ appVersion = '' }) => {
  const { onClick5TimesFooterVersion, closeDebugMenu, showDebugMenu } =
    useClickToPopupDebugMenu();

  return (
    <footer>
      <div className="container">
        <img
          className="logo"
          src="rabby-internal://assets/icons/internal-homepage/logo.svg"
          alt="logo"
        />
        <Dropdown
          open={showDebugMenu}
          onOpenChange={(nextOpen) => {
            if (!nextOpen) {
              closeDebugMenu();
            }
          }}
          overlay={
            <Menu
              items={[
                {
                  key: 'add-debug-insecure-dapps',
                  label: 'Add Debug Insecure Dapps',
                  onClick: () => {
                    window.rabbyDesktop.ipcRenderer.sendMessage(
                      '__internal_rpc:debug-tools:operate-debug-insecure-dapps',
                      'add'
                    );
                  },
                },
                {
                  key: 'trim-debug-insecure-dapps',
                  label: 'Trim Debug Insecure Dapps',
                  onClick: () => {
                    window.rabbyDesktop.ipcRenderer.sendMessage(
                      '__internal_rpc:debug-tools:operate-debug-insecure-dapps',
                      'trim'
                    );
                  },
                },
              ]}
            />
          }
        >
          <div className="version-text" onClick={onClick5TimesFooterVersion}>
            Version: {appVersion || '-'}
          </div>
        </Dropdown>
      </div>
    </footer>
  );
};
