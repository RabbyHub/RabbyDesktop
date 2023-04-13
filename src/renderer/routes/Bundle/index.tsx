import { BundleStateProvider } from '@/renderer/hooks/useBundle/useBundle';
import classNames from 'classnames';
import { HomeTab } from '@/renderer/components/HomeTab/HomeTab';
import { BundleAccountList } from './components/BundleAccountList';
import { BTCAccountList } from './components/BTCAccountList';
import { BinanceAccountList } from './components/BinanceAccountList';
import { ETHAccountList } from './components/ETHAccountList';
import { LeftContainer } from './components/LeftContainer';

const HomeBundleInner = () => {
  return (
    <div className="overflow-hidden h-full">
      <main className="flex h-full">
        <section className="flex-1 mt-[-1px]">
          <LeftContainer />
        </section>
        <section
          className={classNames(
            'flex flex-col overflow-y-auto',
            'w-[358px] px-[28px]',
            'space-y-[24px]',
            'mb-[24px]'
          )}
        >
          <BundleAccountList />
          <div
            className={classNames(
              'border-0 border-b border-solid border-white',
              'opacity-[0.06]'
            )}
          />
          <BTCAccountList />
          <BinanceAccountList />
          <ETHAccountList />
        </section>
      </main>
    </div>
  );
};

export const HomeBundle = () => {
  return (
    <>
      <div className="px-[28px] mt-[8px]">
        <HomeTab />
      </div>
      <BundleStateProvider>
        <HomeBundleInner />
      </BundleStateProvider>
    </>
  );
};
