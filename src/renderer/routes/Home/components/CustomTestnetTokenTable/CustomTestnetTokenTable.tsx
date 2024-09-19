import { useTokenAction } from '@/renderer/components/TokenActionModal/TokenActionModal';
import React from 'react';
import { TBody, THeadCell, THeader, Table } from '../TokenTable/Table';
import {
  CustomTestnetTokenItem,
  Props as TokenItemProps,
} from './CustomTestnetTokenItem';

export interface Props {
  list?: TokenItemProps['item'][];
  isShowHeader?: boolean;
  EmptyComponent?: React.ReactNode;
  FooterComponent?: React.ReactNode;
}

export const CustomTestnetTokenTable: React.FC<Props> = ({
  list,
  EmptyComponent,
  FooterComponent,
  isShowHeader = true,
}) => {
  const { setTokenAction } = useTokenAction();

  return (
    <>
      <Table className="h-full overflow-auto">
        {isShowHeader ? (
          <THeader className="flex w-full sticky bp-8 top-0 z-100 bg-r-neutral-bg-1">
            <THeadCell className="w-1/2">Asset</THeadCell>
            <THeadCell className="w-1/2 text-right">Amount</THeadCell>
          </THeader>
        ) : null}
        <TBody>
          {list?.length ? (
            <>
              {list?.map((item) => {
                return (
                  <CustomTestnetTokenItem
                    onClick={() => setTokenAction(item)}
                    key={`${item.chain}-${item.id}`}
                    item={item}
                  />
                );
              })}
            </>
          ) : (
            EmptyComponent
          )}
        </TBody>
        {FooterComponent}
      </Table>
    </>
  );
};
