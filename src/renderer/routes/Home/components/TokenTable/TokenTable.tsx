import React from 'react';
import { FixedSizeList } from 'react-window';
import { useTokenAction } from '@/renderer/components/TokenActionModal/TokenActionModal';
import { TBody, THeadCell, THeader, Table } from './Table';
import { TokenItem, Props as TokenItemProps } from './TokenItem';

export interface Props {
  list?: TokenItemProps['item'][];
  virtual?: {
    height: number;
    itemSize: number;
  };
  EmptyComponent?: React.ReactNode;
}

export const TokenTable: React.FC<Props> = ({
  list,
  virtual,
  EmptyComponent,
}) => {
  const { setTokenAction } = useTokenAction();

  return (
    <>
      {EmptyComponent && !list?.length ? (
        EmptyComponent
      ) : (
        <Table>
          <THeader className="flex w-full ">
            <THeadCell className="w-1/2">Asset / Amount</THeadCell>
            <THeadCell className="w-1/4">Price</THeadCell>
            <THeadCell className="w-1/4 text-right">USD Value</THeadCell>
          </THeader>
          <TBody className="mt-8">
            {virtual ? (
              <FixedSizeList
                height={virtual.height}
                width="100%"
                itemData={list}
                itemCount={list?.length || 0}
                itemSize={virtual.itemSize}
              >
                {({ data, index, style }) => {
                  const item = data[index];
                  return (
                    <TokenItem
                      onClick={() => setTokenAction(item)}
                      style={style}
                      key={`${item.chain}-${item.id}`}
                      item={item}
                    />
                  );
                }}
              </FixedSizeList>
            ) : (
              list?.map((item) => {
                return (
                  <TokenItem
                    onClick={() => setTokenAction(item)}
                    key={`${item.chain}-${item.id}`}
                    item={item}
                  />
                );
              })
            )}
          </TBody>
        </Table>
      )}
    </>
  );
};
