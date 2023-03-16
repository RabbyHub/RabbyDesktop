import React from 'react';
import cx from 'classnames';
import styled from 'styled-components';

const Wrapper = styled.div`
  display: flex;
  align-items: center;
  .container {
    justify-content: start;
    flex-wrap: wrap;
  }
  .container > div {
    text-overflow: ellipsis;
    overflow-wrap: break-word;
    word-break: break-all;
  }

  .container img {
    margin-right: 6px;
  }
  .label {
    margin-left: 5px;
  }
`;

type Props = {
  label: string | JSX.Element | undefined;
  icon: JSX.Element;
  maxWidth?: number;
  style?: React.CSSProperties;
  textHidden?: boolean;
  labelClassName?: string;
  className?: string;
};

const LabelWithIcon: React.FC<Props> = ({
  label,
  className,
  maxWidth,
  style,
  labelClassName,
  textHidden,
  icon,
}) => {
  return (
    <Wrapper
      title={typeof label === 'string' ? label : ''}
      className={className}
      style={Object.assign(maxWidth ? { maxWidth } : {}, style)}
    >
      {icon}
      <div className={cx(textHidden && 'ellipsis', labelClassName, 'label')}>
        {label}
      </div>
    </Wrapper>
  );
};

export default LabelWithIcon;
