import { Dropdown, Menu } from 'antd';
import React, { useEffect } from 'react';
import { hideMainwinPopupview } from '@/renderer/ipcRequest/mainwin-popupview';
import {
  usePopupViewInfo,
  useZPopupLayerOnMain,
} from '@/renderer/hooks/usePopupWinOnMainwin';
import { useClickOutSide } from '@/renderer/hooks/useClick';
import { ADD_DROPDOWN_LEFT_OFFSET, getAddDropdownKeyrings } from './constants';
import styles from './index.module.less';

const keyrings = getAddDropdownKeyrings();

export default function AddAddressDropdown() {
  const { visible } = usePopupViewInfo('add-address-dropdown');
  const hoveredRef = React.useRef(true);
  useEffect(() => {
    hoveredRef.current = visible;
  }, [visible]);

  const zActions = useZPopupLayerOnMain();

  const handleClick = React.useCallback(
    (info: { key: string }) => {
      hideMainwinPopupview('add-address-dropdown');
      zActions.showZSubview('add-address-modal', {
        keyringType: info.key,
      });
    },
    [zActions]
  );

  const handleOpen = React.useCallback(() => {
    hoveredRef.current = true;
  }, []);

  const handleClose = React.useCallback(() => {
    hoveredRef.current = false;
    hideMainwinPopupview('add-address-dropdown');
  }, []);

  const overlayRef = React.useRef<HTMLDivElement>(null);

  useClickOutSide(overlayRef, () => {
    hideMainwinPopupview('add-address-dropdown');
  });

  return (
    <Dropdown
      open={hoveredRef.current}
      trigger={['click', 'hover']}
      overlay={
        <div
          ref={overlayRef}
          onMouseEnter={handleOpen}
          onMouseLeave={handleClose}
        >
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
        onMouseEnter={handleOpen}
        // onMouseLeave={handleClose}
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
