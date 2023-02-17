import cx from 'clsx';
import styled from 'styled-components';

interface AddressViewProps {
  address: string;
  onClick?(): void;
  ellipsis?: boolean;
  className?: string;
  index?: number;
  showIndex?: boolean;
}

const AddressViewWrapper = styled.div`
  .address-viewer-text {
    &.normal {
      margin-right: 4px;
      font-size: 15px;
      line-height: 18px;
      font-weight: 500;
      color: #fff;
    }
    &.subtitle {
      font-size: 12px;
    }
    &.import-color {
      margin-right: 4px;
      font-size: 15px;
      line-height: 18px;
      font-weight: 500;
      color: #fff;
      color: #000000;
    }
    .number-index {
      font-weight: normal;
      font-size: 12px;
      color: #b4bdcc;
      margin-right: 22px;
    }
  }
`;

export default ({
  address,
  onClick,
  ellipsis = true,
  className = 'normal',
  index = -1,
  showIndex = false,
}: AddressViewProps) => {
  return (
    <AddressViewWrapper
      className="flex items-center"
      onClick={onClick}
      style={{ cursor: onClick ? 'pointer' : 'inherit' }}
    >
      <div
        className={cx('address-viewer-text', className)}
        title={address?.toLowerCase()}
      >
        {showIndex && index >= 0 && <div className="number-index">{index}</div>}
        {ellipsis
          ? `${address?.toLowerCase().slice(0, 6)}...${address
              ?.toLowerCase()
              .slice(-4)}`
          : address?.toLowerCase()}
      </div>
    </AddressViewWrapper>
  );
};
