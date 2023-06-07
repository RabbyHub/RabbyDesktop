import { Avatar, Button, Divider, Form, Input, List } from 'antd';
import {
  extractProductNameFromHIDPath,
  keywordMatch,
} from '@/isomorphic/string';

import { useEffect, useMemo } from 'react';
import RabbyInput from '@/renderer/components/AntdOverwrite/Input';
import { numberToHex } from '@/isomorphic/primitive';
import { usePrevious } from 'react-use';
import SvgIconDeviceManufacturer from './device-manufacturer.svg?rc';
import { useIsViewingDevices } from '../../settingHooks';
import styles from './index.module.less';
import { testRequestDevice, useFilteredHidDevices } from './useFilteredDevices';
import DeviceAttr from './DeviceAttr';

export default function DeviceViewHID() {
  const {
    hidDevices,
    debouncedKeyword,
    isFetchingDevice,
    fetchDevices,
    filterKeyword,
    setFilterKeyword,
  } = useFilteredHidDevices();

  const { isViewingDevices } = useIsViewingDevices();
  const isPreViewingDevices = usePrevious(isViewingDevices);

  useEffect(() => {
    if (!isPreViewingDevices && isViewingDevices) {
      fetchDevices();
    }
  }, [isPreViewingDevices, isViewingDevices, fetchDevices]);

  const filteredHidDevices = useMemo(() => {
    if (!debouncedKeyword) return hidDevices;

    const kw = debouncedKeyword.toLowerCase();

    const filtered = hidDevices.filter((device) => {
      return (
        keywordMatch(kw, device.product) ||
        keywordMatch(kw, device.productId) ||
        keywordMatch(kw, device.vendorId) ||
        keywordMatch(kw, device.path) ||
        keywordMatch(kw, device.serialNumber) ||
        keywordMatch(kw, device.manufacturer)
      );
    });

    return filtered;
  }, [hidDevices, debouncedKeyword]);

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
          dataSource={filteredHidDevices}
          renderItem={(deviceItem) => {
            const productName =
              deviceItem.product ||
              extractProductNameFromHIDPath(deviceItem.path || '');

            return (
              <List.Item className={styles.deviceItem}>
                <List.Item.Meta
                  avatar={
                    <Avatar
                      className={styles.deviceAvatar}
                      src="rabby-internal://assets/icons/developer-kits/hid.svg"
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
                        value={deviceItem.manufacturer}
                      />
                    </div>
                  }
                  description={
                    <div className={styles.itemDesc}>
                      <div className={styles.itemDescAtts}>
                        <DeviceAttr
                          className={styles.J_ID}
                          label="ID"
                          value={deviceItem.productId}
                        />
                        <DeviceAttr
                          className={styles.J_VENDORID}
                          label="VendorId"
                          value={`${deviceItem.vendorId} (${numberToHex(
                            deviceItem.vendorId
                          )})`}
                        />
                        <DeviceAttr
                          label="SN"
                          value={deviceItem.serialNumber}
                        />
                      </div>
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
            loading={isFetchingDevice}
            className={styles.op_btn}
            type="primary"
            onClick={() => {
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
