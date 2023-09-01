import { useState, useEffect } from 'react';
import styled from 'styled-components';
import clsx from 'classnames';
import { formatUsdValue } from '@/renderer/utils/number';
import {
  KEYRINGS_LOGOS,
  WALLET_BRAND_CONTENT,
  KEYRING_CLASS,
} from '@/renderer/utils/constant';
import { RabbyAccount } from '@/isomorphic/types/rabbyx';
import AddressViewer from './AddressViewer';
import { useCurrentAccount } from '../hooks/rabbyx/useAccount';
import { walletController } from '../ipcRequest/rabbyx';
import useCurrentBalance from '../hooks/useCurrentBalance';

const AccountCardWrapper = styled.div`
  height: 72px;
  padding: 0;
  background: rgba(134, 151, 255, 0.2);
  border-radius: 4px;
  margin-bottom: 10px;
  .icon-account {
    width: 32px;
    height: 32px;
    margin-right: 12px;
  }
  .account-detail {
    height: 72px;
    width: 100%;
    padding: 10px 12px;
    display: flex;
    align-items: center;
    .send-text {
      color: #fff;
      font-size: 15px;
      line-height: 18px;
      margin-bottom: 2px;
    }
    .amount {
      flex: 1;
      text-align: right;
      color: #fff;
      font-size: 15px;
      line-height: 18px;
    }
    .address-viewer-text {
      font-size: 13px;
      line-height: 15px;
      font-weight: 500;
    }
    .address-viewer-text {
      color: rgba(255, 255, 255, 0.6);
    }
  }
`;

const AccountCard = ({
  icons,
  alianName,
  account,
}: {
  icons?: {
    mnemonic: string;
    privatekey: string;
    watch: string;
  };
  alianName?: string | null;
  account?: RabbyAccount & { alianName: string; balance?: number };
}) => {
  const { currentAccount: realCurrentAccount } = useCurrentAccount();
  const [currentAccount, setCurrentAccount] = useState<
    (RabbyAccount & { alianName: string; balance?: number }) | null
  >(account || null);
  const [currentAccountAlianName, setCurrentAccountAlianName] = useState('');
  const getAccountIcon = (type: string | undefined) => {
    if (currentAccount && type) {
      if (
        WALLET_BRAND_CONTENT[
          currentAccount?.brandName as keyof typeof WALLET_BRAND_CONTENT
        ]
      ) {
        return WALLET_BRAND_CONTENT[
          currentAccount?.brandName as keyof typeof WALLET_BRAND_CONTENT
        ].image;
      }

      if (icons) {
        switch (type) {
          case KEYRING_CLASS.MNEMONIC:
            return icons.mnemonic;
          case KEYRING_CLASS.PRIVATE_KEY:
            return icons.privatekey;
          case KEYRING_CLASS.WATCH:
            return icons.watch;
          default:
            return '';
        }
      }

      return KEYRINGS_LOGOS[type];
    }
    return '';
  };

  useEffect(() => {
    (async () => {
      const current = account || realCurrentAccount;
      setCurrentAccount(current || null);
      const alias = await walletController.getAlianName(
        currentAccount?.address?.toLowerCase() || ''
      );
      setCurrentAccountAlianName(alias || '');
    })();
  }, [currentAccount, realCurrentAccount, account]);

  const { balance } = useCurrentBalance(currentAccount?.address);
  const icon = getAccountIcon(currentAccount?.type);

  if (!currentAccount) return <></>;
  return (
    <AccountCardWrapper className={clsx('account-card')}>
      <div className={clsx('account-detail')}>
        <img src={icon} className="icon icon-account" />
        {(alianName || currentAccountAlianName) && (
          <div className="flex flex-col">
            <div
              className={clsx('send-text', !alianName && 'text-white')}
              title={alianName || currentAccountAlianName}
            >
              {alianName || currentAccountAlianName}
            </div>
            <AddressViewer address={currentAccount.address} />
          </div>
        )}
        <span className="amount truncate" title={formatUsdValue(balance || 0)}>
          {formatUsdValue(balance || 0)}
        </span>
      </div>
    </AccountCardWrapper>
  );
};

export default AccountCard;
