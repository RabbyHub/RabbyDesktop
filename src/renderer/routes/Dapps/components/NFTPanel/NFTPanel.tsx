import Hide from '@/renderer/components/MainWindow/Hide';
import { walletController } from '@/renderer/ipcRequest/rabbyx';
import classNames from 'classnames';
import React from 'react';
import clsx from 'clsx';
import { useSettings } from '@/renderer/hooks/useSettings';
import { useAtom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';
import { MintedSuccessful } from './MintedSuccessful';
import { StepGroup } from './StepGroup';
import { MintedData } from './util';
import { ZoraTip } from './ZoraTip';
import styles from './style.module.less';

const nftIsCollapsedAtom = atomWithStorage('nftIsCollapsed', false);

export const NFTPanel = () => {
  const [isEventEnd, setIsEventEnd] = React.useState(false);
  const [total, setTotal] = React.useState(0);
  const [mintedData, setMintedData] = React.useState<MintedData>();
  const [isLoading, setIsLoading] = React.useState(true);

  const { settings } = useSettings();

  const [nftIsCollapsed, setNftIsCollapsed] = useAtom(nftIsCollapsedAtom);
  const isFold = settings.sidebarCollapsed;

  const checkMinted = React.useCallback(() => {
    setIsLoading(true);

    walletController.getMintedRabby().then((result) => {
      setMintedData(undefined);

      if (result) {
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

  const getTotal = React.useCallback(() => {
    walletController.mintedRabbyTotal().then((n) => setTotal(Number(n)));
  }, []);

  React.useEffect(() => {
    getTotal();
    checkEndDateTime();
    checkMinted();
    // watch account change and recheck
    return window.rabbyDesktop.ipcRenderer.on(
      '__internal_push:rabbyx:session-broadcast-forward-to-desktop',
      (payload) => {
        if (payload.event === 'accountsChanged') {
          checkMinted();
          getTotal();
        }
      }
    );
  }, [checkMinted, checkEndDateTime, getTotal]);

  const visible = !isLoading && !isEventEnd;

  return (
    <Hide unmountOnExit visible={visible}>
      <div
        className={classNames(
          'flex fixed w-[933px] top-auto mx-auto rounded-[8px]',
          'bg-[#2D313E] text-white shadow-xl',
          mintedData ? 'w-[755px] inset-[50px]' : 'w-[933px] inset-[20px]',
          ' transition-all duration-300 ease-in-out ',
          nftIsCollapsed ? styles.fold : styles.unfold
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
            src="rabby-internal://assets/icons/mint/nft.svg"
            className={classNames(
              'rounded-[4px]',
              'object-cover',
              mintedData ? 'w-[64px] h-[64px]' : 'w-[112px] h-[112px]',
              'transition-all duration-300 ease-in-out'
            )}
          />
          <div
            className={classNames(
              'flex flex-col ml-16 py-[7px]',
              mintedData ? 'justify-center' : 'justify-between'
            )}
          >
            <div>
              <h2
                className={classNames(
                  'mb-[9px]',
                  'text-[20px] text-white',
                  mintedData ? 'font-medium' : 'font-bold'
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
            {mintedData ? null : (
              <footer
                className={classNames(
                  'items-center flex',
                  'text-[12px] font-medium opacity-60'
                )}
              >
                <span>Powered by zora</span>
                <ZoraTip />
              </footer>
            )}
          </div>
        </div>
        <div className={classNames('p-[15px] flex-1 flex item-center')}>
          {mintedData ? (
            <MintedSuccessful {...mintedData} />
          ) : (
            <StepGroup
              onMinted={(data) => {
                setMintedData(data);
                setTotal((prev) => prev + 1);
              }}
            />
          )}
        </div>

        <div
          className=" absolute right-[-10px] top-[-10px] cursor-pointer w-28 h-28 rounded-full  flex items-center justify-center"
          onClick={() => {
            setNftIsCollapsed(true);
          }}
        >
          <img
            src="rabby-internal://assets/icons/mint/mint-close.svg"
            className="w-24 h-24"
          />
        </div>
      </div>

      <div
        className={clsx(
          'fixed top-auto ml-[48px] group w-[56px] flex items-center',
          isFold ? 'left-[66px]' : 'left-[var(--mainwin-sidebar-w)]',
          mintedData ? 'inset-[50px] h-[94px]' : 'inset-[20px] h-[142px] '
        )}
      >
        <img
          onClick={() => {
            setNftIsCollapsed(false);
          }}
          src={
            mintedData
              ? 'rabby-internal://assets/icons/mint/mint-badge.png'
              : 'rabby-internal://assets/icons/mint/unmint-badge.png'
          }
          className={classNames(
            styles.shadow,
            'w-[56px] h-[56px] transition-all duration-300 ease-in-out',
            nftIsCollapsed
              ? 'opacity-100 cursor-pointer delay-250  duration-50'
              : 'opacity-0 pointer-events-none duration-300'
          )}
        />
      </div>
    </Hide>
  );
};
