import RabbyInput from '@/renderer/components/AntdOverwrite/Input';
import { Modal as RModal } from '@/renderer/components/Modal/Modal';
import { Button, Form, Modal, Radio } from 'antd';
import classNames from 'classnames';
import { useCallback } from 'react';
import { useCheckProxy, useSettingProxyModal } from '../../settingHooks';
import styles from './index.module.less';

export default function ModalProxySetting() {
  const {
    isSettingProxy,
    setIsSettingProxy,

    proxyCustomForm,
    localProxyType,
    setLocalProxyType,

    applyProxyAndRelaunch,
  } = useSettingProxyModal();
  const {
    checkingTarget,
    onCheckingTargetChange,
    onValidateProxy,
    isCheckingProxy,
  } = useCheckProxy();

  const isUsingCustomProxy = localProxyType === 'custom';

  const doValidate = useCallback(() => {
    if (!isUsingCustomProxy || !checkingTarget) return;

    const values = proxyCustomForm.getFieldsValue();

    onValidateProxy({
      protocol: values.protocol,
      hostname: values.hostname,
      port: values.port,
    });
  }, [proxyCustomForm, onValidateProxy, isUsingCustomProxy, checkingTarget]);

  return (
    <RModal
      visible={isSettingProxy}
      width={400}
      centered
      className={styles.ModalProxySetting}
      onCancel={() => {
        setIsSettingProxy(false);
      }}
    >
      <h2 className="form-title">Proxy Settings</h2>

      <div className="ant-form ant-form-vertical">
        <Form.Item label={<span className="form-item-label">Type: </span>}>
          <Radio.Group
            options={[
              { label: 'None', value: 'none' },
              { label: 'System', value: 'system' },
              { label: 'Custom', value: 'custom' },
            ]}
            value={localProxyType}
            optionType="button"
            onChange={(e) => {
              setLocalProxyType(e.target.value!);
            }}
          />
        </Form.Item>
      </div>

      <Form
        form={proxyCustomForm}
        // onValuesChange={(changedValues, allValues) => {
        //   setProxySettings(allValues);
        // }}
        layout="vertical"
        className={classNames(
          'proxy-custom-form',
          !isUsingCustomProxy && 'disabled'
        )}
      >
        <Form.Item
          label={<span className="form-item-label">Protocol: </span>}
          name="protocol"
        >
          <Radio.Group
            options={[
              { label: 'HTTP', value: 'http' },
              { label: 'SOCKS 5', value: 'socks5' },
            ]}
            disabled={!isUsingCustomProxy}
            optionType="button"
          />
        </Form.Item>

        <Form.Item
          name="hostname"
          className="input-field"
          // style={{ flexShrink: 1 }}
          label={<span className="form-item-label">Hostname: </span>}
          rules={[]}
        >
          <RabbyInput
            disabled={!isUsingCustomProxy}
            spellCheck={false}
            placeholder="Hostname or IP"
          />
        </Form.Item>

        <Form.Item
          name="port"
          className="input-field"
          // style={{ flexShrink: 0, width: 80 }}
          label={<span className="form-item-label">Port: </span>}
          rules={[]}
        >
          <RabbyInput
            disabled={!isUsingCustomProxy}
            spellCheck={false}
            placeholder="Port"
          />
        </Form.Item>

        {/* <div className='one-line-items'>
          <Form.Item
            name="username"
            className="input-field"
            style={{ flexShrink: 1 }}
            label={<span className="form-item-label">(optional) Username: </span>}
            rules={[]}
          >
            <RabbyInput
              disabled={!isUsingCustomProxy}
              spellCheck={false}
              placeholder="Proxy Server Username"
            />
          </Form.Item>

          <Form.Item
            name="password"
            className="input-field"
            style={{ flexShrink: 1 }}
            label={<span className="form-item-label">(optional) Password: </span>}
            rules={[]}
          >
            <RabbyInput
              disabled={!isUsingCustomProxy}
              spellCheck={false}
              type="password"
              placeholder="Proxy Server Password"
            />
          </Form.Item>
        </div> */}
        <Form.Item
          label={<span className="form-item-label">Checking: </span>}
          className="input-field"
        >
          <RabbyInput
            disabled={!isUsingCustomProxy || !checkingTarget}
            className="mr-[4px]"
            prefix="https://"
            suffix={
              <div className="check-btn-wrapper">
                <Button
                  className={classNames(
                    'check-proxy-btn',
                    !isUsingCustomProxy && 'hidden'
                  )}
                  loading={isCheckingProxy}
                  disabled={!isUsingCustomProxy}
                  type="link"
                  onClick={() => {
                    doValidate();
                  }}
                >
                  Check
                </Button>
              </div>
            }
            onChange={onCheckingTargetChange}
            value={checkingTarget}
            onKeyUpCapture={(evt) => {
              if (evt.key === 'Enter') {
                doValidate();
              }
            }}
          />
        </Form.Item>
      </Form>

      <div className="operations">
        <div className="btns">
          <Button
            disabled={isCheckingProxy}
            className="op_btn"
            type="primary"
            onClick={() => {
              Modal.confirm({
                title: 'Apply Proxy Settings',
                content: `It's required to restart the app to apply the proxy settings, do you want to restart now?`,
                okText: 'Restart',
                onOk: () => {
                  applyProxyAndRelaunch();
                },
                onCancel: () => {},
              });
            }}
          >
            Apply
          </Button>
        </div>
      </div>
    </RModal>
  );
}
