import { Modal as AntdModal, ModalProps } from 'antd';
import classNames from 'classnames';
import './modal.less';

export interface Props extends Omit<ModalProps, 'onCancel'> {
  backable?: boolean;
  subtitle?: string;
  onBack?: () => void;
  onCancel?: (e?: React.MouseEvent<HTMLElement>) => void;
  smallTitle?: boolean;
  closeIcon?: React.ReactNode;
}

export const Modal: React.FC<Props> = ({
  backable,
  title,
  subtitle,
  onBack,
  smallTitle,
  closeIcon,
  ...props
}) => {
  return (
    <AntdModal
      width={1000}
      maskTransitionName=""
      transitionName=""
      {...props}
      className={classNames('RabbyModal', props.className, {
        'small-title': smallTitle,
      })}
      destroyOnClose
      footer={null}
      closeIcon={
        closeIcon ?? (
          <img
            className="icon close"
            src="rabby-internal://assets/icons/modal/close.svg"
          />
        )
      }
      title={
        (backable || title) && (
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
        )
      }
    />
  );
};
