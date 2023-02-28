import { Dropdown, Menu } from 'antd';
import React from 'react';
import { hideMainwinPopupview } from '@/renderer/ipcRequest/mainwin-popupview';
import { useZPopupLayerOnMain } from '@/renderer/hooks/usePopupWinOnMainwin';
import { useConnectLedger } from '@/renderer/hooks/useConnectLedger';
import { ADD_DROPDOWN_LEFT_OFFSET, getAddDropdownKeyrings } from './constants';
import styles from './index.module.less';

const keyrings = getAddDropdownKeyrings();

function hideView(timeout = 200) {
  setTimeout(() => {
    hideMainwinPopupview('add-address-dropdown');
    // give some time for animation on hiding the dropdown
  }, timeout);
}

export default function AddAddressDropdown() {
  const zActions = useZPopupLayerOnMain();
  const onOpenChange = React.useCallback((open: boolean) => {
    if (!open) {
      hideView();
    }
  }, []);
  const connectLedger = useConnectLedger();

  const handleClick = React.useCallback(
    (info: { key: string }) => {
      connectLedger(info.key);
      hideView();
      zActions.showZSubview('add-address-modal', {
        keyringType: info.key,
      });
    },
    [connectLedger, zActions]
  );

  return (
    <Dropdown
      mouseEnterDelay={0}
      onOpenChange={onOpenChange}
      overlay={
        <div>
          <Menu prefixCls="Rabby" className={styles.Menu} onClick={handleClick}>
            {keyrings.map((keyring) => (
              <Menu.Item className={styles.MenuItem} key={keyring.id}>
                <div className="flex items-center">
                  <img className={styles.Icon} src={keyring.logo} />
                  <span className={styles.ItemName}>{keyring.name}</span>
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
