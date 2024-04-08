import { Image, ImageProps } from 'antd';
import clsx from 'clsx';
import { useMemo } from 'react';

import { covertIpfsHttpToRabbyIpfs } from '@/isomorphic/custom-scheme';
import { findChain } from '@/renderer/utils/chain';
import { getOriginName, hashCode } from '../../utils';
import { TooltipWithMagnetArrow } from '../Tooltip/TooltipWithMagnetArrow';
import './index.less';

const bgColorList = [
  '#F69373',
  '#91D672',
  '#C0E36C',
  '#A47CDF',
  '#6BD5D6',
  '#ED7DBC',
  '#7C93EF',
  '#65BBC0',
  '#6EB7FB',
  '#6091CD',
  '#F6B56F',
  '#DFA167',
];

const useFallbackImage = (origin: string) => {
  const [bgColor, originName] = useMemo(() => {
    const bgIndex = Math.abs(hashCode(origin) % 12);

    return [bgColorList[bgIndex].toLowerCase(), getOriginName(origin || '')];
  }, [origin]);
  const src = `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'><rect x="0" y="0" width="32" height="32" fill="${encodeURIComponent(
    bgColor
  )}"/><text x='16' y='18' dominant-baseline="middle" text-anchor='middle' fill='white' font-size='15' font-weight='500'>${originName?.[0]?.toUpperCase()}</text></svg>`;
  return src;
};

interface FaviconProps extends ImageProps {
  origin: string;
  chain?: CHAINS_ENUM;
  iconStyle?: React.CSSProperties;
  isShowChainTooltip?: boolean;
}

export const DappFavicon = (props: FaviconProps) => {
  const {
    origin,
    src,
    chain,
    rootClassName,
    isShowChainTooltip = false,
    ...rest
  } = props;
  const fallbackImage = useFallbackImage(origin);
  const chainInfo = useMemo(() => {
    if (chain) {
      return findChain({ enum: chain });
    }
    return null;
  }, [chain]);

  const chainLogo = chainInfo?.logo;

  return (
    <div className={clsx('rabby-dapp-favicon', rootClassName)}>
      <Image
        preview={false}
        src={covertIpfsHttpToRabbyIpfs(src || fallbackImage)}
        fallback={fallbackImage}
        {...rest}
      />
      {chainLogo && (
        <>
          {isShowChainTooltip && chainInfo ? (
            <TooltipWithMagnetArrow title={chainInfo?.name}>
              <img
                src={chainLogo}
                alt=""
                className="rabby-dapp-favicon-chain"
              />
            </TooltipWithMagnetArrow>
          ) : (
            <img src={chainLogo} alt="" className="rabby-dapp-favicon-chain" />
          )}
        </>
      )}
    </div>
  );
};
