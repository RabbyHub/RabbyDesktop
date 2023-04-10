import { BundleStateProvider } from '@/renderer/hooks/useBundle/useBundle';
import classNames from 'classnames';
import { HomeTab } from '@/renderer/components/HomeTab/HomeTab';
import { BundleAccountList } from './components/BundleAccountList';
import { BTCAccountList } from './components/BTCAccountList';
import { BinanceAccountList } from './components/BinanceAccountList';
import { ETHAccountList } from './components/ETHAccountList';

const HomeBundleInner = () => {
  return (
    <div className="overflow-hidden h-full">
      <main className="flex h-full">
        <section className="flex-1">资产列表</section>
        <section
          className={classNames(
            'flex flex-col overflow-y-auto',
            'w-[358px] px-[28px]'
          )}
        >
          <BundleAccountList />
          <div
            className={classNames(
              'my-[26px]',
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
