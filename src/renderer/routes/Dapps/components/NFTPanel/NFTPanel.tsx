import Hide from '@/renderer/components/MainWindow/Hide';
import { walletController } from '@/renderer/ipcRequest/rabbyx';
import { Tooltip } from 'antd';
import classNames from 'classnames';
import React from 'react';
import { MintedSuccessful } from './MintedSuccessful';
import { StepGroup } from './StepGroup';
import { MintedData, ZORE_MINT_FEE } from './util';

export const NFTPanel = () => {
  const [isMinted, setIsMinted] = React.useState(false);
  const [isEventEnd, setIsEventEnd] = React.useState(false);
  const [total, setTotal] = React.useState(0);
  const [mintedData, setMintedData] = React.useState<MintedData>();
  const [isOwner, setIsOwner] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(true);

  const checkMinted = React.useCallback(() => {
    setIsLoading(true);

    walletController.getMintedRabby().then((result) => {
      setIsMinted(false);
      setMintedData(undefined);
      setIsOwner(false);

      if (!result) {
        // nothing
      } else if (result.isOwner) {
        setIsMinted(true);
        setIsOwner(true);
      } else {
        setIsMinted(true);
        setMintedData(result);
      }

      setIsLoading(false);
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

  const visible = !isLoading && !isEventEnd;

  return (
    <Hide unmountOnExit visible={visible}>
      <div
        className={classNames(
          'flex fixed w-[933px] top-auto mx-auto rounded-[8px]',
          'bg-[#2D313E] text-white shadow overflow-hidden',
          isMinted ? 'w-[755px] inset-[50px]' : 'w-[933px] inset-[20px]',
          'transition-all duration-300 ease-in-out'
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
              'rounded-[4px]',
              'object-cover',
              isMinted ? 'w-[64px] h-[64px]' : 'w-[112px] h-[112px]',
              'transition-all duration-300 ease-in-out'
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
                  'flex items-center m-0',
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
            {isMinted ? null : (
              <footer
                className={classNames(
                  'items-center flex',
                  'text-[12px] font-medium opacity-60'
                )}
              >
                <span>Powered by zora</span>
                <span className={classNames('ml-[5px]')}>
                  <Tooltip
                    title={`A ${ZORE_MINT_FEE}ETH fee goes to Zora for each mint.`}
                  >
                    <img src="rabby-internal://assets/icons/mint/icon-help.svg" />
                  </Tooltip>
                </span>
              </footer>
            )}
          </div>
        </div>
        <div className={classNames('p-[15px] flex-1 flex item-center')}>
          {mintedData || isOwner ? (
            <MintedSuccessful isOwner={isOwner} {...mintedData} />
          ) : (
            <StepGroup onMinted={setMintedData} />
          )}
        </div>
      </div>
    </Hide>
  );
};
