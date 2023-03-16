import Hide from '@/renderer/components/MainWindow/Hide';
import { walletController } from '@/renderer/ipcRequest/rabbyx';
import { Tooltip } from 'antd';
import classNames from 'classnames';
import React from 'react';
import { MintedSuccessful } from './MintedSuccessful';
import { StepGroup } from './StepGroup';
import { MintedData, useZoraMintFee } from './util';

export const NFTPanel = () => {
  const [isMinted, setIsMinted] = React.useState(true);
  const [isEventEnd, setIsEventEnd] = React.useState(false);
  const [total, setTotal] = React.useState(0);
  const fee = useZoraMintFee();
  const [mintedData, setMintedData] = React.useState<MintedData>();

  const checkMinted = React.useCallback(() => {
    walletController.isMintedRabby().then((result) => {
      setIsMinted(result);
    });
  }, []);

  const checkEndDateTime = React.useCallback(() => {
    walletController.mintedRabbyEndDateTime().then((result) => {
      if (!result) return;
      const endDateTime = new Date(result);
      const now = new Date();

      setIsEventEnd(now > endDateTime);
    });
  }, []);

  React.useEffect(() => {
    walletController.mintedRabbyTotal().then(setTotal);
    checkEndDateTime();
    checkMinted();
    // watch account change and recheck
    return window.rabbyDesktop.ipcRenderer.on(
      '__internal_push:rabbyx:session-broadcast-forward-to-desktop',
      (payload) => {
        if (payload.event === 'accountsChanged') {
          checkMinted();
        }
      }
    );
  }, [checkMinted, checkEndDateTime]);

  const visible = !isMinted && !isEventEnd;

  return (
    <Hide unmountOnExit visible={visible}>
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
            backgroundImage: `url(rabby-internal://assets/icons/mint/bg-arrow-right.svg)`,
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
            className={classNames(
              'flex flex-col ml-16 py-[7px] justify-between'
            )}
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
                  <img src="rabby-internal://assets/icons/mint/icon-help.svg" />
                </Tooltip>
              </span>
            </footer>
          </div>
        </div>
        <div className={classNames('p-[15px] flex-1 flex item-center')}>
          {mintedData ? (
            <MintedSuccessful {...mintedData} />
          ) : (
            <StepGroup onMinted={setMintedData} />
          )}
        </div>
      </div>
    </Hide>
  );
};
