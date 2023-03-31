import { ReceiveModalWraper } from '@/renderer/components/ReceiveModal';
import { useMemo, useState } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import { Tooltip } from 'antd';
import { useIsSafe } from '@/renderer/hooks/rabbyx/useSafe';
import IconReceive from '../../../../../assets/icons/home/receive.svg?rc';
import IconSend from '../../../../../assets/icons/home/send.svg?rc';
import IconSwap from '../../../../../assets/icons/home/swap.svg?rc';
import { QueueIcon } from './QueueIcon';

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
  margin-bottom: 65px;
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

const RightBar = ({ updateNonce }: { updateNonce: number }) => {
  const [isShowReceive, setIsShowReceive] = useState(false);
  const isSafe = useIsSafe();
  const navigateTo = useNavigate();
  const actions = useMemo(() => {
    const list = [
      {
        id: 'swap',
        name: 'Swap',
        icon: <IconSwap width="35px" height="35px" />,
        onClick: () => {
          navigateTo('/mainwin/home/swap?rbisource=home');
        },
      },
      {
        id: 'send',
        name: 'Send',
        icon: <IconSend width="35px" height="35px" />,
        onClick: () => {
          navigateTo('/mainwin/home/send-token?rbisource=home');
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
    ];

    return list;
  }, [navigateTo]);

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
        {isSafe && (
          <li>
            <QueueIcon />
          </li>
        )}
      </ActionList>
      {/* <Transactions updateNonce={updateNonce} /> */}
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
