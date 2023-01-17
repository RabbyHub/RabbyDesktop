import { Modal as AntdModal, ModalProps } from 'antd';
import classNames from 'classnames';
import './modal.less';

export interface Props extends ModalProps {
  backable?: boolean;
  subtitle?: string;
  onBack?: () => void;
}

export const Modal: React.FC<Props> = ({
  backable,
  title,
  subtitle,
  onBack,
  ...props
}) => {
  return (
    <AntdModal
      width={1000}
      {...props}
      className={classNames('RabbyModal', props.className)}
      destroyOnClose
      footer={null}
      closeIcon={
        <img
          className="icon close"
          src="rabby-internal://assets/icons/modal/close.svg"
        />
      }
      title={
        <>
          {backable && (
            <span onClick={onBack} className="ant-modal-close-x back">
              <img
                className="icon"
                src="rabby-internal://assets/icons/modal/back.svg"
              />
            </span>
          )}
          {title && (
            <div className="headline">
              <span className="title">{title}</span>
              {subtitle && <span className="subtitle">{subtitle}</span>}
            </div>
          )}
        </>
      }
    />
  );
};
