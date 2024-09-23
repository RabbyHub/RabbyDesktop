import { Input, Skeleton } from 'antd';
import React, { useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useDebounce, useInfiniteScroll, useRequest } from 'ahooks';
import { sortBy } from 'lodash';
import { TestnetChain } from '@/isomorphic/types/customTestnet';
import { walletController, walletOpenapi } from '@/renderer/ipcRequest/rabbyx';
import { findChain } from '@/renderer/utils/chain';
import { TooltipWithMagnetArrow } from '@/renderer/components/Tooltip/TooltipWithMagnetArrow';
import { Modal } from '@/renderer/components/Modal/Modal';
import { createTestnetChain } from '../util';
import { Emtpy } from './Empty';
import { CustomTestnetItem } from './CustomTestnetItem';
import styles from '../index.module.less';

const Loading = () => {
  return (
    <>
      <div className="chain-list-item relative flex items-center px-[16px] py-[11px] gap-[12px] bg-r-neutral-card2 rounded-[6px]">
        <Skeleton.Avatar active />
        <div className="flex flex-col gap-[4px]">
          <Skeleton.Input active className="w-[80px] h-[16px]" />
          <Skeleton.Input active className="w-[145px] h-[14px]" />
        </div>
      </div>
      <div className="chain-list-item relative flex items-center px-[16px] py-[11px] gap-[12px] bg-r-neutral-card2 rounded-[6px]">
        <Skeleton.Avatar active />
        <div className="flex flex-col gap-[4px]">
          <Skeleton.Input active className="w-[80px] h-[16px]" />
          <Skeleton.Input active className="w-[145px] h-[14px]" />
        </div>
      </div>
    </>
  );
};

const CustomTestnetList = ({
  loadingMore,
  list,
  onSelect,
}: {
  loadingMore?: boolean;
  list: TestnetChain[];
  onSelect?: (chain: TestnetChain) => void;
}) => {
  const { t } = useTranslation();
  return (
    <div className="rounded-[6px] bg-r-neutral-card2">
      {list?.map((item) => {
        const chain = findChain({ id: item.id });

        return chain ? (
          <div className="relative chain-list-item" key={`${item.id}tooltip`}>
            <TooltipWithMagnetArrow
              trigger="click"
              align={{
                offset: [0, 30],
              }}
              placement="top"
              title={
                chain?.isTestnet
                  ? t('page.customTestnet.AddFromChainList.tips.added')
                  : t('page.customTestnet.AddFromChainList.tips.supported')
              }
            >
              <CustomTestnetItem item={item} disabled />
            </TooltipWithMagnetArrow>
          </div>
        ) : (
          <CustomTestnetItem
            item={item}
            key={item.id}
            onClick={onSelect}
            className="relative chain-list-item"
          />
        );
      })}
      {loadingMore ? <Loading /> : null}
    </div>
  );
};

export const AddFromChainList = ({
  visible,
  onClose,
  onSelect,
}: {
  visible?: boolean;
  onClose?: () => void;
  onSelect?: (chain: TestnetChain) => void;
}) => {
  const { t } = useTranslation();
  const [_search, setSearch] = React.useState('');
  const ref = useRef<HTMLDivElement>(null);
  const search = useDebounce(_search, { wait: 500 });
  const wallet = walletController;

  const { loading, data, loadingMore } = useInfiniteScroll(
    async (params) => {
      const res = await walletOpenapi.searchChainList({
        start: params?.start || 0,
        limit: 50,
        q: search,
      });

      return {
        list: res.chain_list.map((item) => {
          return createTestnetChain({
            name: item.name,
            id: item.chain_id,
            nativeTokenSymbol: item.native_currency.symbol,
            rpcUrl: item.rpc || '',
            scanLink: item.explorer || '',
          });
        }),
        start: res.page.start + res.page.limit,
        total: res.page.total,
      };
    },
    {
      isNoMore(params) {
        return !!params && (params.list?.length || 0) >= (params?.total || 0);
      },
      reloadDeps: [search],
      target: ref,
      threshold: 150,
    }
  );

  const { data: usedList, loading: isLoadingUsed } = useRequest(() => {
    return wallet.getUsedCustomTestnetChainList().then((list) => {
      return sortBy(
        list.map((item) => {
          return createTestnetChain({
            name: item.name,
            id: item.chain_id,
            nativeTokenSymbol: item.native_currency.symbol,
            rpcUrl: item.rpc || '',
            scanLink: item.explorer || '',
          });
        }),
        'name'
      );
    });
  });

  const isLoading = loading || isLoadingUsed;
  const list = useMemo(() => {
    if (search) {
      return data?.list || [];
    }
    return (data?.list || []).filter((item) => {
      return !usedList?.find((used) => used.id === item.id);
    });
  }, [data?.list, usedList, search]);

  const isEmpty = useMemo(() => {
    if (isLoading) {
      return false;
    }
    if (search) {
      return !list?.length;
    }
    return !usedList?.length && !list?.length;
  }, [isLoading, search, list, usedList]);

  return (
    <Modal
      className={styles.modal}
      open={visible}
      onCancel={onClose}
      width={480}
      footer={null}
      // closable={false}
      centered
    >
      <div className={styles.content}>
        <header className={styles.modalHeader}>
          <div className={styles.modalTitle}>
            {t('page.customTestnet.AddFromChainList.title')}
          </div>
          <div className={styles.modalSearch}>
            <Input
              prefix={
                <img src="rabby-internal://assets/icons/common/search.svg" />
              }
              placeholder={t('page.customTestnet.AddFromChainList.search')}
              onChange={(e) => setSearch(e.target.value)}
              value={_search}
              allowClear
            />
          </div>
        </header>

        {isLoading ? (
          <div className="px-[24px]">
            <div className="rounded-[6px] bg-r-neutral-card2">
              <Loading />
            </div>
          </div>
        ) : isEmpty ? (
          <Emtpy description={t('page.customTestnet.AddFromChainList.empty')} />
        ) : (
          <div ref={ref} className="flex-1 overflow-auto pl-[24px] pr-[20px]">
            {usedList?.length && !search ? (
              <div className="mb-[20px]">
                <CustomTestnetList list={usedList || []} onSelect={onSelect} />
              </div>
            ) : null}
            <CustomTestnetList
              list={list}
              loadingMore={loadingMore}
              onSelect={onSelect}
            />
          </div>
        )}
      </div>
    </Modal>
  );
};
