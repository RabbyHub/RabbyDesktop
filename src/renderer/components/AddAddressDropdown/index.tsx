import { Dropdown, Menu } from 'antd';
import React from 'react';
import { hideMainwinPopupview } from '@/renderer/ipcRequest/mainwin-popupview';
import { useZPopupLayerOnMain } from '@/renderer/hooks/usePopupWinOnMainwin';
import { detectOS } from '@/isomorphic/os';
import { ADD_DROPDOWN_LEFT_OFFSET, getAddDropdownKeyrings } from './constants';
import styles from './index.module.less';

const keyrings = getAddDropdownKeyrings();

export default function AddAddressDropdown() {
  const zActions = useZPopupLayerOnMain();
  const IS_MACOS = detectOS() === 'darwin';
  const onOpenChange = React.useCallback((open: boolean) => {
    if (!open) {
      hideMainwinPopupview('add-address-dropdown');
    }
  }, []);

  const handleClick = React.useCallback(
    (info: { key: string }) => {
      hideMainwinPopupview('add-address-dropdown');
      zActions.showZSubview('add-address-modal', {
        keyringType: info.key,
      });
    },
    [zActions]
  );

  const props = IS_MACOS
    ? {}
    : {
        open: true,
      };

  return (
    <Dropdown
      {...props}
      onOpenChange={onOpenChange}
      overlay={
        <div>
          <Menu className={styles.Menu}>
            {keyrings.map((keyring) => (
              <Menu.Item className={styles.MenuItem} key={keyring.id}>
                <div className="flex items-center">
                  <img className={styles.Icon} src={keyring.logo} />
                  <span
                    className={styles.ItemName}
                    onClick={() => handleClick({ key: keyring.id })}
                  >
                    {keyring.name}
                  </span>
                </div>
              </Menu.Item>
            ))}
          </Menu>
        </div>
      }
    >
      <div
        className={styles.NewAccountIcon}
        style={{
          position: 'absolute',
          left: ADD_DROPDOWN_LEFT_OFFSET,
          top: 0,
        }}
      />
    </Dropdown>
  );
}
