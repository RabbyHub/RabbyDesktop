import { CSSProperties, ReactNode } from 'react';
import styled from 'styled-components';

const EmptyWrapper = styled.div`
  .empty-image {
    display: block;
    margin: 0 auto;
  }
  .empty-title {
    color: var(--r-neutral-body, #d3d8e0);
    text-align: center;
    font-size: 17px;
    line-height: 20px;
    font-weight: 500;
    margin-top: 20px;
    margin-bottom: 12px;
  }
  .empty-desc {
    color: var(--r-neutral-foot, #babec5);
    text-align: center;
    font-size: 14px;
    font-weight: 400;
    line-height: 17px;
  }
`;

interface EmptyProps {
  className?: string;
  title?: ReactNode;
  desc?: ReactNode;
  style?: CSSProperties;
  image?: string;
}
export const Empty = ({ className, title, desc, image, style }: EmptyProps) => {
  return (
    <EmptyWrapper className={className} style={style}>
      <img
        className="empty-image"
        src={
          image || 'rabby-internal://assets/icons/signature-record/empty.svg'
        }
        alt=""
      />
      <div className="empty-title">{title}</div>
      <div className="empty-desc">{desc}</div>
    </EmptyWrapper>
  );
};
