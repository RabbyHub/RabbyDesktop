import { walletController } from '@/renderer/ipcRequest/rabbyx';
import { Tooltip } from 'antd';
import BigNumber from 'bignumber.js';
import classNames from 'classnames';
import React from 'react';
import { StepGroup } from './StepGroup';

const IS_MINTED_KEY = 'IS_MINTED';

export const NFTPanel = () => {
  const [isMinted, setIsMinted] = React.useState(true);
  const [total, setTotal] = React.useState(0);
  const [fee, setFee] = React.useState(0);

  React.useEffect(() => {
    if (localStorage.getItem(IS_MINTED_KEY)) {
      setIsMinted(true);
      return;
    }
    walletController.isMintedRabby().then((result) => {
      if (result) {
        localStorage.setItem(IS_MINTED_KEY, '1');
      }
      setIsMinted(result);
    });

    walletController.mintedRabbyTotal().then(setTotal);
    walletController.mintRabbyFee().then((result) => {
      const n = new BigNumber(result).div(1e18).toNumber();
      setFee(n);
    });
  }, []);

  if (isMinted) {
    return null;
  }

  return (
    <div
      className={classNames(
        'flex fixed w-[64vw] inset-[20px] top-auto mx-auto rounded-[8px]',
        'bg-[#2D313E] text-white shadow overflow-hidden'
      )}
    >
      <div
        className={classNames(
          'flex-1 flex p-[15px]',
          'bg-[#2D313E] bg-no-repeat bg-cover bg-right'
        )}
        style={{
          backgroundImage: `url(rabby-internal://assets/icons/add-dapp/bg-arrow-right.svg)`,
        }}
      >
        <img
          src="https://via.placeholder.com/150"
          className={classNames(
            'w-[112px] h-[112px] rounded-[4px]',
            'object-cover'
          )}
        />
        <div
          className={classNames('flex flex-col ml-16 py-[7px] justify-between')}
        >
          <div>
            <h2
              className={classNames(
                'mb-[9px]',
                'text-[20px] font-bold text-white'
              )}
            >
              Rabby Desktop Genesis
            </h2>
            <p
              className={classNames(
                'flex items-center',
                'text-[14px] font-medium opacity-60'
              )}
            >
              <div>{total} minted</div>
              <div
                className={classNames(
                  'mx-[10px] w-1 h-[14px]',
                  'bg-white opacity-40'
                )}
              />
              <div>Time limited</div>
            </p>
          </div>
          <footer
            className={classNames(
              'items-center flex',
              'text-[12px] font-medium opacity-60'
            )}
          >
            <span>Powered by zora</span>
            <span className={classNames('ml-[5px]')}>
              <Tooltip title={`A ${fee}ETH fee goes to Zora for each mint.`}>
                <img src="rabby-internal://assets/icons/add-dapp/icon-help.svg" />
              </Tooltip>
            </span>
          </footer>
        </div>
      </div>
      <div className={classNames('p-[15px] flex-1 flex item-center')}>
        <StepGroup />
      </div>
    </div>
  );
};
