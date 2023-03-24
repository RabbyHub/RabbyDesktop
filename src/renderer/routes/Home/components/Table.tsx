import { ReactNode } from 'react';
import styled from 'styled-components';
import classNames from 'classnames';

const TableWrapper = styled.div``;

export const Table = ({ children }: { children: ReactNode }) => {
  return <TableWrapper>{children}</TableWrapper>;
};

const RowWrapper = styled.div`
  display: flex;
  font-weight: 400;
  font-size: 14px;
  line-height: 14px;
  color: #ffffff;
  padding: 16px 22px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  &:nth-last-child(1) {
    border: none;
  }
  &.table-header {
    padding: 0 22px;
    color: rgba(255, 255, 255, 0.5);
    border: none;
    font-size: 12px;
    margin-bottom: 4px;
    margin-top: 4px;
  }
  &:not(.table-header):hover {
    background-color: rgba(0, 0, 0, 0.06);
  }
`;

const Row = ({
  children,
  className,
  header = false,
}: {
  children: ReactNode;
  className?: string;
  header?: boolean;
}) => {
  return (
    <RowWrapper className={classNames(className, { 'table-header': header })}>
      {children}
    </RowWrapper>
  );
};
Table.Row = Row;

const ColWrapper = styled.div`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  margin-right: 15px;
  &:nth-last-child(1) {
    margin-right: 0;
  }
  &:nth-last-child(2) {
    margin-right: 8px;
  }

  &:not(.header):nth-child(1),
  &:not(.header):nth-last-child(1) {
    font-size: 14px;
    font-weight: 500;
  }
  &:not(.header):nth-last-child(1) {
    font-weight: 700;
  }
  &:nth-last-child(1) {
    justify-content: flex-end;
  }
`;
const Col = ({
  children,
  className,
  header,
}: {
  children: ReactNode;
  className?: string;
  header?: boolean;
}) => {
  return (
    <ColWrapper className={classNames(className, { header })}>
      {children}
    </ColWrapper>
  );
};
Table.Col = Col;

const Header = ({ headers }: { headers: string[] }) => {
  return (
    <Row header>
      {headers.map((item) => (
        <Col header>{item}</Col>
      ))}
    </Row>
  );
};

const Body = ({ children }: { children: ReactNode }) => {
  return <div>{children} </div>;
};

Table.Body = Body;

Table.Header = Header;
