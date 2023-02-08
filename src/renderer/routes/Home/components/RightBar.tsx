import styled from 'styled-components';
import { showMainwinPopupview } from '@/renderer/ipcRequest/mainwin-popupview';
import Transactions from './Transactions';
import IconSwap from '../../../../../assets/icons/home/swap.svg?rc';
import IconSend from '../../../../../assets/icons/home/send.svg?rc';
import IconReceive from '../../../../../assets/icons/home/receive.svg?rc';
import IconSecurity from '../../../../../assets/icons/home/security.svg?rc';
import IconGasTopup from '../../../../../assets/icons/home/gas-topup.svg?rc';

const RightBarWrapper = styled.div`
  width: 330px;
  margin-left: 28px;
  height: 100%;
  display: flex;
  flex-direction: column;
  max-height: calc(100vh - 88px);
`;

const ActionList = styled.ul`
  list-style: none;
  padding: 48px 0 0 23px;
  display: flex;
  margin-bottom: 65px;
  li {
    border-radius: 14px;
    margin-right: 25px;
    cursor: pointer;
    svg {
      &:hover {
        rect:nth-child(1) {
          fill: #8697ff;
          fill-opacity: 0.8;
        }
        g {
          opacity: 0.7;
        }
        path {
          fill-opacity: 0.7;
        }
      }
    }
    &:nth-last-child(1) {
      margin-right: 0;
    }
  }
`;

const RightBar = () => {
  const actions = [
    {
      id: 'swap',
      name: 'swap',
      icon: <IconSwap width="35px" height="35px" />,
      onClick: () => {
        showMainwinPopupview({ type: 'quick-swap' }, { openDevTools: false });
      },
    },
    {
      id: 'send',
      name: 'Send',
      icon: <IconSend width="35px" height="35px" />,
    },
    {
      id: 'receive',
      name: 'Receive',
      icon: <IconReceive width="35px" height="35px" />,
    },
    {
      id: 'gas-topup',
      name: 'Gas Top Up',
      icon: <IconGasTopup width="35px" height="35px" />,
    },
    {
      id: 'security',
      name: 'Security',

      icon: <IconSecurity width="35px" height="35px" />,
    },
  ];
  return (
    <RightBarWrapper>
      <ActionList>
        {actions.map((action) => (
          <li key={action.id} onClick={action.onClick}>
            {action.icon}
          </li>
        ))}
      </ActionList>
      <Transactions />
    </RightBarWrapper>
  );
};

export default RightBar;
