import { RabbyAccount } from '@/isomorphic/types/rabbyx';
import { useAccountToDisplay } from '@/renderer/hooks/rabbyx/useAccountToDisplay';
import { walletController } from '@/renderer/ipcRequest/rabbyx';
import { isSameAddress } from '@/renderer/utils/address';
import { LoadingOutlined } from '@ant-design/icons';
import { CHAINS, Chain } from '@debank/common';
import Safe from '@rabby-wallet/gnosis-sdk';
import { SafeInfo } from '@rabby-wallet/gnosis-sdk/dist/api';
import { Spin } from 'antd';
import classNames from 'classnames';
import clsx from 'clsx';
import { sortBy } from 'lodash';
import React, { useState } from 'react';
import { useAsync } from 'react-use';
import NameAndAddress from '../NameAndAddress';
import { crossCompareOwners } from '../QueueModal/util';
import { AccountDetailItem } from './AccountDetailItem';

const IconTagYou = 'rabby-internal://assets/icons/queue/tag-you.svg';

const LoadingIcon = (
  <LoadingOutlined style={{ fontSize: 20, color: '#8697ff' }} spin />
);

export const SafeItem: React.FC<{ account: RabbyAccount }> = ({ account }) => {
  const { accountsList } = useAccountToDisplay();

  const [activeData, setActiveData] = useState<
    | {
        chain?: Chain;
        data: SafeInfo;
      }
    | undefined
  >(undefined);

  const {
    value: safeInfos,
    error,
    loading,
  } = useAsync(async () => {
    const address = account?.address;
    if (!address) return [];
    const networks = await walletController.getGnosisNetworkIds(address);
    const res: { chain: Chain | undefined; data: SafeInfo }[] = [];
    // eslint-disable-next-line no-restricted-syntax
    for (const networkId of networks) {
      // eslint-disable-next-line no-await-in-loop
      const info = await Safe.getSafeInfo(address, networkId);

      // eslint-disable-next-line no-await-in-loop
      const owners = await walletController.getGnosisOwners(
        account,
        address,
        info.version,
        networkId
      );

      const comparedOwners = crossCompareOwners(owners, info.owners);

      res.push({
        chain: Object.values(CHAINS).find(
          (chain) => chain.network === networkId
        ),
        data: {
          ...info,
          owners: comparedOwners,
        },
      });
    }

    const list = sortBy(res, (item) => {
      return -(item?.data?.owners?.length || 0);
    });
    setActiveData(list[0]);
    return list;
  }, []);

  if (loading || !safeInfos) {
    return (
      <AccountDetailItem headline="Admins">
        <Spin indicator={LoadingIcon} />
      </AccountDetailItem>
    );
  }

  return (
    <AccountDetailItem
      headline="Admins"
      className="h-auto pt-[20px] pb-[2px]"
      details={
        <div>
          <div className="flex flex-wrap items-center gap-x-[12px] gap-y-[10px] mt-[3px] mb-[12px]">
            {safeInfos?.map((item) => {
              return (
                <div
                  className={clsx(
                    'cursor-pointer border-0 border-b-2 border-solid pt-[4px] pb-2px text-[12px] leading-[14px]',
                    activeData?.chain?.enum === item?.chain?.enum
                      ? 'border-b-[#8697FF] text-[#8697FF]'
                      : 'border-b-transparent'
                  )}
                  onClick={() => {
                    setActiveData(item);
                  }}
                  key={item?.chain?.enum}
                >
                  {item?.chain?.name}
                </div>
              );
            })}
          </div>
          <div className="text-[12px] text-[#FFFFFFCC]">
            Any transaction requires{' '}
            <span className="text-white text-[13px]">
              {activeData?.data?.threshold}/{activeData?.data?.owners.length}
            </span>{' '}
            confirmations
          </div>
          <div className="mt-[4px]">
            <ul className="list-none m-0 p-0">
              {activeData?.data?.owners.map((owner) => {
                const isYou = accountsList.find((_account) =>
                  isSameAddress(_account.address, owner)
                );
                return (
                  <li
                    className={classNames(
                      `flex text-white 
                      border-solid border-0 border-b 
                      border-[rgba(255,255,255,0.1)] 
                      last:border-b-0 py-[12px]
                      mt-0`
                    )}
                    key={owner}
                  >
                    <NameAndAddress
                      address={owner}
                      className="text-[12px]"
                      nameClass="text-[12px] text-white font-normal"
                      addressClass="text-[12px] text-white"
                      copyIconClass="opacity-100"
                    />
                    {isYou ? (
                      <img src={IconTagYou} className="ml-[5px]" />
                    ) : null}
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      }
    />
  );
};
