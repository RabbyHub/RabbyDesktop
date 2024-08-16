import { Drawer, DrawerProps } from 'antd';
import clsx from 'clsx';
import { ReactNode } from 'react';
import ReactDOM from 'react-dom';
import './index.less';
import '@/renderer/utils/i18n';

const SvgIconCross = 'rabby-internal://assets/icons/modal/close.svg';
const closeIcon = (
  <img src={SvgIconCross} className="w-[24px] fill-current text-gray-content" />
);

interface PopupProps extends DrawerProps {
  onCancel?(): void;
  children?: ReactNode;
}

const Popup = ({
  children,
  closable = false,
  placement = 'bottom',
  className,
  onClose,
  onCancel,
  ...rest
}: PopupProps) => (
  <Drawer
    onClose={onClose || onCancel}
    closable={closable}
    placement={placement}
    className={clsx('custom-popup', className)}
    destroyOnClose
    closeIcon={closeIcon}
    {...rest}
  >
    {children}
  </Drawer>
);

const open = (
  config: PopupProps & {
    content?: ReactNode;
  }
) => {
  const container = document.createDocumentFragment();

  function destroy() {
    ReactDOM.unmountComponentAtNode(container);
  }

  function render({
    visible = true,
    content,
    onClose,
    onCancel,
    ...props
  }: any) {
    function close() {
      render({
        visible: false,
        afterVisibleChange: (v) => {
          if (!v) {
            destroy();
          }
        },
      });
    }

    setTimeout(() => {
      const handleCancel = () => {
        close?.();
        onClose?.();
        onCancel?.();
      };
      ReactDOM.render(
        <Popup open={false} onClose={handleCancel} {...props}>
          {content}
        </Popup>,
        container
      );
      if (visible) {
        setTimeout(() => {
          ReactDOM.render(
            <Popup open={visible} onClose={handleCancel} {...props}>
              {content}
            </Popup>,
            container
          );
        });
      }
    });
  }

  render(config);

  return {
    // eslint-disable-next-line no-restricted-globals
    destroy: close,
  };
};

// eslint-disable-next-line no-multi-assign
Popup.open = Popup.info = open;

export default Popup;
