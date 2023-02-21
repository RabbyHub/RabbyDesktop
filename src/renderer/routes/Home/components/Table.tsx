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
  font-size: 12px;
  line-height: 14px;
  color: #ffffff;
  padding: 16px 0;
  &:nth-last-child(1) {
    border: none;
  }
  &.table-header {
    padding: 0;
    color: rgba(255, 255, 255, 0.5);
    border: none;
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
  &:nth-last-child(1) {
    justify-content: flex-end;
  }
`;
const Col = ({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) => {
  return <ColWrapper className={className}>{children}</ColWrapper>;
};
Table.Col = Col;

const Header = ({ headers }: { headers: string[] }) => {
  return (
    <Row header>
      {headers.map((item) => (
        <Col>{item}</Col>
      ))}
    </Row>
  );
};

const Body = ({ children }: { children: ReactNode }) => {
  return <div>{children} </div>;
};

Table.Body = Body;

Table.Header = Header;
