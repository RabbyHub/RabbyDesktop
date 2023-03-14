import classNames from 'classnames';
import { StepGroup } from './StepGroup';

export const NFTPanel = () => {
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
              <div>221 minted</div>
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
              <a href="https://zora.co">
                <img src="rabby-internal://assets/icons/add-dapp/icon-help.svg" />
              </a>
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
