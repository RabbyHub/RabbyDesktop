import { Modal as RabbyModal } from '@/renderer/components/Modal/Modal';
import { Avatar, Button, Divider, Form, Input, List, message } from 'antd';
import { useHidDevices } from '@/renderer/hooks/useHidDevices';
import {
  extractProductNameFromHIDPath,
  keywordMatch,
} from '@/isomorphic/string';

import classNames from 'classnames';
import { copyText } from '@/renderer/utils/clipboard';
import React, { useEffect, useMemo } from 'react';
import useDebounceValue from '@/renderer/hooks/useDebounceValue';
import SvgIconDeviceManufacturer from './device-manufacturer.svg?rc';
import { useIsViewingDevices } from '../../settingHooks';
import styles from './index.module.less';

function copyAttrValue(input: Parameters<typeof copyText>[0]) {
  copyText(input);

  message.open({
    type: 'success',
    content: 'Copied',
  });
}

function DeviceAttr({
  icon,
  label,
  value,
  className,
}: React.PropsWithChildren<{
  icon?: React.ReactNode;
  label: string;
  value?: string | number;
  className?: string;
}>) {
  return (
    <span className={classNames(styles.deviceAttr, className)}>
      <span className={styles.attrLabel}>
        {icon || null}
        {label}:
      </span>
      <span
        className={classNames(styles.attrValue, value && styles.copiable)}
        onClick={() => {
          if (!value) return;

          copyAttrValue(value);
        }}
      >
        {value || '-'}
      </span>
    </span>
  );
}

function useFilteredDevices() {
  const { isFetchingDevice, devices, fetchDevices } = useHidDevices();
  const [filterKeyword, setFilterKeyword] = React.useState('');

  const debouncedKeyword = useDebounceValue(filterKeyword, 300);

  const filteredDevices = useMemo(() => {
    if (!debouncedKeyword) return devices;

    const kw = debouncedKeyword.toLowerCase();

    const filtered = devices.filter((device) => {
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
  }, [devices, debouncedKeyword]);

  return {
    devices,
    isFetchingDevice,
    fetchDevices,
    filterKeyword,
    setFilterKeyword,
    filteredDevices,
  };
}

export default function ModalDevices() {
  const {
    filteredDevices,
    isFetchingDevice,
    fetchDevices,
    filterKeyword,
    setFilterKeyword,
  } = useFilteredDevices();

  const { isViewingDevices, setIsViewingDevices } = useIsViewingDevices();

  useEffect(() => {
    if (!isViewingDevices) return;
    fetchDevices();
  }, [isViewingDevices, fetchDevices]);

  return (
    <RabbyModal
      className={styles.modalDevicesModal}
      visible={isViewingDevices}
      width={1000}
      onCancel={() => {
        setIsViewingDevices(false);
      }}
    >
      <h2 className={styles['form-title']}>HID Devices List</h2>

      <div className={styles.devicesFilters}>
        <Form>
          <Form.Item>
            <Input
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
            const productName =
              deviceItem.product ||
              extractProductNameFromHIDPath(deviceItem.path || '');

            return (
              <List.Item className={styles.deviceItem}>
                <List.Item.Meta
                  avatar={
                    <Avatar
                      className={styles.deviceAvatar}
                      src="rabby-internal://assets/icons/mainwin-settings/devices.svg"
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
                    <>
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
                    </>
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
    </RabbyModal>
  );
}
