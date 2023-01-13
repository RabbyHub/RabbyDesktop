import { Modal as RabbyModal } from '@/renderer/components/Modal/Modal';
import { Button, Form, Input, Modal, Radio } from 'antd';
import classNames from 'classnames';
import styled from 'styled-components';
import { useCheckProxy, useSettingProxyModal } from '../../settingHooks';

const RModal = styled(RabbyModal)`
  .form-title {
    font-size: 20px;
    text-align: center;
  }
  .form-item-label {
    color: white;
    font-size: 15px;
  }

  .h2,
  h4,
  .form-title,
  .ant-form-item-label label::after {
    color: white;
  }

  .ant-form-item + .ant-form,
  .ant-form-item + .ant-form-item {
    margin-top: 24px;
  }

  .ant-modal-content {
    padding: 36px 32px;
    width: 480px;
    min-height: 300px;
  }

  .ant-modal-close-x {
    padding: 36px 24px;
  }

  .proxy-custom-form.disabled {
    pointer-events: none;
    opacity: 0.5;
  }

  .input-field {
    .ant-form-item-control-input,
    .ant-form-item-control-input-content,
    .ant-input {
      height: 52px;
    }

    .ant-input {
      background: transparent;
      color: white;
      border-color: rgba(255, 255, 255, 0.1);
    }
  }

  .one-line-items {
    display: flex;
    align-items: center;

    .ant-form-item + .ant-form-item {
      margin-top: 0;
      margin-left: 12px;
    }
  }

  .ant-radio-group {
    background-color: var(--color-comment1);
    border-radius: 6px;
    .ant-radio-button-wrapper {
      background-color: transparent;
      border-radius: 6px;
      color: white;
      border-color: transparent;
      &::before {
        display: none;
      }
    }
    .ant-radio-button-wrapper.ant-radio-button-wrapper-checked {
      background: #ffffff;
      color: var(--color-primary);
      border-radius: 6px;
      border-color: transparent;
    }
  }

  .operations {
    margin-top: 12px;

    .check-btn-wrapper {
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .check-proxy-btn {
      text-align: center;
      color: #ffffff;
      border-color: none;

      > span {
        text-decoration-line: underline;
      }

      opacity: 0.7;
      &:not([disabled]):hover {
        opacity: 1;
      }
    }

    .btns {
      margin-top: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .btns > .op_btn {
      width: 50%;
      flex-shrink: 1;
      height: 48px;
      width: 200px;
      border-radius: 4px;
    }
  }
`;

export default function ModalProxySetting() {
  const {
    isSettingProxy,
    setIsSettingProxy,

    proxyCustomForm,
    proxyType,
    setProxyType,

    applyProxyAndRelaunch,
  } = useSettingProxyModal();
  const { onValidateProxy, isCheckingProxy } = useCheckProxy();

  const isUsingCustomProxy = proxyType === 'custom';

  return (
    <RModal
      visible={isSettingProxy}
      width={400}
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
            value={proxyType}
            optionType="button"
            onChange={(e) => {
              setProxyType(e.target.value!);
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
          <Input
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
          <Input
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
            <Input
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
            <Input
              disabled={!isUsingCustomProxy}
              spellCheck={false}
              type="password"
              placeholder="Proxy Server Password"
            />
          </Form.Item>
        </div> */}
      </Form>

      <div className="operations">
        <div className="check-btn-wrapper">
          <Button
            className="check-proxy-btn"
            loading={isCheckingProxy}
            disabled={!isUsingCustomProxy}
            type="link"
            onClick={() => {
              const values = proxyCustomForm.getFieldsValue();
              onValidateProxy({
                protocol: values.protocol,
                hostname: values.hostname,
                port: values.port,
              });
            }}
          >
            Check
          </Button>
        </div>

        <div className="btns">
          <Button
            disabled={isCheckingProxy}
            className="op_btn"
            type="primary"
            onClick={() => {
              Modal.confirm({
                title: 'Apply Proxy Settings',
                content: `It's required to restart the app to apply the proxy settings, do you want to restart now?`,
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
