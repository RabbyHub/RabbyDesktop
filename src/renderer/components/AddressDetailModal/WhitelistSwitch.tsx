import { useWhitelist } from '@/renderer/hooks/rabbyx/useWhitelist';
import { Switch } from 'antd';
import React from 'react';
import { ModalConfirm } from '../Modal/Confirm';

export interface Props {
  account: IDisplayedAccountWithBalance;
}

export const WhitelistSwitch: React.FC<Props> = ({ account }) => {
  const { whitelist, setWhitelist } = useWhitelist();
  const isInWhitelist = React.useMemo(() => {
    return whitelist.some((e) => e === account.address);
  }, [whitelist, account.address]);

  const onToggle = React.useCallback(() => {
    if (whitelist.includes(account.address)) {
      ModalConfirm({
        centered: true,
        title: 'Remove from Whitelist',
        height: 268,
        onOk: () => {
          setWhitelist(whitelist.filter((e) => e !== account.address));
        },
      });
    } else {
      ModalConfirm({
        centered: true,
        title: 'Save to Whitelist',
        height: 268,
        onOk: () => {
          setWhitelist([...whitelist, account.address]);
        },
      });
    }
  }, [whitelist, account.address, setWhitelist]);

  return <Switch onChange={onToggle} checked={isInWhitelist} />;
};
