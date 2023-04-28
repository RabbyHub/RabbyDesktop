import { useMemo } from 'react';
import IconQuoteLoading from '@/../assets/icons/swap/quote-loading.svg?rc';

export const QuoteLogo = ({
  logo,
  isLoading,
  boxSize = 40,
  size = 24,
  loadingSize = 32,
}: {
  logo: string;
  isLoading?: boolean;
  boxSize?: number;
  size?: number;
  loadingSize?: number;
}) => {
  const [logoStyle, boxStyle, loadingStyle] = useMemo(
    () => [
      {
        width: size,
        height: size,
      },
      {
        width: boxSize,
        height: boxSize,
      },
      {
        width: loadingSize,
        height: loadingSize,
        fontSize: `${loadingSize}px`,
      },
    ],
    [boxSize, loadingSize, size]
  );
  return (
    <div style={boxStyle} className="flex items-center justify-center">
      <div
        style={logoStyle}
        className="relative flex items-center justify-center"
      >
        <img style={logoStyle} className="rounded-full" src={logo} />
        {isLoading && (
          <div
            style={loadingStyle}
            className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 flex items-center justify-center"
          >
            <IconQuoteLoading className="animate-spin" />
          </div>
        )}
      </div>
    </div>
  );
};
