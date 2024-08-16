import IconQuoteLoading from '@/../assets/icons/swap/quote-loading.svg?rc';
import clsx from 'clsx';

export const QuoteLogo = ({
  isLoading,
  logo,
  isCex = false,
  loaded = false,
}: {
  isLoading?: boolean;
  logo: string;
  isCex?: boolean;
  loaded?: boolean;
}) => {
  return (
    <div className="flex items-center justify-center w-32 h-32">
      <div className="relative flex items-center justify-center">
        <img
          className={clsx('rounded-full', 'min-w-[32px] w-32 h-32')}
          src={logo}
        />
        {isLoading && (
          <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 flex items-center justify-center">
            <IconQuoteLoading
              className={clsx('animate-spin', 'w-40 h-40')}
              viewBox="0 0 40 40"
            />
          </div>
        )}
      </div>
    </div>
  );
};
