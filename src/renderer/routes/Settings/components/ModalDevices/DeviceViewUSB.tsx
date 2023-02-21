import { Avatar, Button, Divider, Form, Input, List } from 'antd';
import { keywordMatch } from '@/isomorphic/string';

import { useEffect, useMemo } from 'react';
import RabbyInput from '@/renderer/components/AntdOverwrite/Input';
import SvgIconDeviceManufacturer from './device-manufacturer.svg?rc';
import { useIsViewingDevices } from '../../settingHooks';
import styles from './index.module.less';
import { testRequestDevice, useFilteredDevices } from './useFilteredDevices';
import DeviceAttr from './DeviceAttr';

export default function DeviceViewUSB() {
  const {
    usbDevices,
    debouncedKeyword,
    isFetchingDevice,
    fetchDevices,
    filterKeyword,
    setFilterKeyword,
  } = useFilteredDevices('usb');

  const filteredDevices = useMemo(() => {
    if (!debouncedKeyword) return usbDevices;

    const kw = debouncedKeyword.toLowerCase();

    const filtered = usbDevices.filter((device) => {
      return (
        keywordMatch(kw, device.productName) ||
        keywordMatch(kw, device.productId) ||
        keywordMatch(kw, device.vendorId) ||
        keywordMatch(kw, device.serialNumber) ||
        keywordMatch(kw, device.manufacturerName)
      );
    });

    return filtered;
  }, [usbDevices, debouncedKeyword]);

  const { isViewingDevices } = useIsViewingDevices();

  useEffect(() => {
    if (!isViewingDevices) return;
    fetchDevices();
  }, [isViewingDevices, fetchDevices]);

  return (
    <>
      <div className={styles.devicesFilters}>
        <Form>
          <Form.Item>
            <RabbyInput
              value={filterKeyword}
              placeholder="Local filter by ID, VendorId, Path, SN, etc"
              onChange={(e) => {
                setFilterKeyword(e.target.value);
              }}
            />
          </Form.Item>
        </Form>
      </div>

      <div className={styles.devicesList}>
        <List
          itemLayout="horizontal"
          bordered
          dataSource={filteredDevices}
          renderItem={(deviceItem) => {
            const { productName } = deviceItem;

            return (
              <List.Item className={styles.deviceItem}>
                <List.Item.Meta
                  avatar={
                    <Avatar
                      className={styles.deviceAvatar}
                      src="rabby-internal://assets/icons/developer-kits/usb.svg"
                    />
                  }
                  title={
                    <div className={styles.deviceItemTitle}>
                      <span className={styles.J_name}>
                        {productName || '-'}
                      </span>
                      <Divider type="vertical" />
                      <DeviceAttr
                        icon={
                          <>
                            <SvgIconDeviceManufacturer
                              className={styles.deviceLabelIcon}
                            />{' '}
                          </>
                        }
                        label="manufacturer"
                        value={deviceItem.manufacturerName}
                      />
                    </div>
                  }
                  description={
                    <div className={styles.itemDesc}>
                      <DeviceAttr
                        className={styles.J_ID}
                        label="ID"
                        value={deviceItem.productId}
                      />
                      <DeviceAttr
                        className={styles.J_VENDORID}
                        label="VendorId"
                        value={deviceItem.vendorId}
                      />
                      <DeviceAttr label="SN" value={deviceItem.serialNumber} />

                      <div className={styles.rightOps}>
                        <Button
                          type="link"
                          onClick={(evt) => {
                            evt.preventDefault();
                            testRequestDevice({
                              vendorId: deviceItem.vendorId,
                              productId: deviceItem.productId,
                            });
                          }}
                        >
                          Try Request It
                        </Button>
                      </div>
                    </div>
                  }
                />
              </List.Item>
            );
          }}
        />
      </div>

      <div className={styles.operations}>
        <div className={styles.btns}>
          <Button
            // disabled={isCheckingProxy}
            loading={isFetchingDevice}
            className={styles.op_btn}
            type="primary"
            onClick={() => {
              // TODO: refresh
              fetchDevices();
            }}
          >
            Refresh
          </Button>
        </div>
      </div>
    </>
  );
}
