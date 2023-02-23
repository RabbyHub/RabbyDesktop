import { ReceiveModalWraper } from '@/renderer/components/ReceiveModal';
import { useState } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import { Tooltip } from 'antd';
import IconReceive from '../../../../../assets/icons/home/receive.svg?rc';
import IconSend from '../../../../../assets/icons/home/send.svg?rc';
import IconSwap from '../../../../../assets/icons/home/swap.svg?rc';
import Transactions from './Transactions';

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
  padding: 50px 0 0 0;
  display: flex;
  margin-bottom: 80px;
  justify-content: center;
  gap: 50px;
  li {
    border-radius: 14px;
    /* margin-right: 25px; */
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
      /* margin-right: 0; */
    }
  }
`;

const RightBar = () => {
  const [isShowReceive, setIsShowReceive] = useState(false);

  const navigateTo = useNavigate();
  const actions = [
    {
      id: 'swap',
      name: 'Swap',
      icon: <IconSwap width="35px" height="35px" />,
      onClick: () => {
        navigateTo('/mainwin/swap');
      },
    },
    {
      id: 'send',
      name: 'Send',
      icon: <IconSend width="35px" height="35px" />,
      onClick: () => {
        navigateTo('/mainwin/send-token');
      },
    },
    {
      id: 'receive',
      name: 'Receive',
      icon: <IconReceive width="35px" height="35px" />,
      onClick: () => {
        setIsShowReceive(true);
      },
    },
    // {
    //   id: 'gas-topup',
    //   name: 'Gas Top Up',
    //   icon: <IconGasTopup width="35px" height="35px" />,
    // },
    // {
    //   id: 'security',
    //   name: 'Security',

    //   icon: <IconSecurity width="35px" height="35px" />,
    // },
  ];
  return (
    <RightBarWrapper>
      <ActionList>
        {actions.map((action) => (
          <Tooltip
            key={action.id}
            title={action.name}
            overlayInnerStyle={{ padding: '6px 8px' }}
          >
            <li onClick={action.onClick}>{action.icon}</li>
          </Tooltip>
        ))}
      </ActionList>
      <Transactions />
      <ReceiveModalWraper
        open={isShowReceive}
        onCancel={() => {
          setIsShowReceive(false);
        }}
      />
    </RightBarWrapper>
  );
};

export default RightBar;
