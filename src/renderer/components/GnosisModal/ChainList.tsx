import { Chain, CHAINS, CHAINS_ENUM } from '@debank/common';
import classNames from 'classnames';
import { ChainItem } from './ChainItem';
import styles from './style.module.less';

const SUPPORT_CHAINS = [
  CHAINS_ENUM.ETH,
  CHAINS_ENUM.BSC,
  CHAINS_ENUM.POLYGON,
  CHAINS_ENUM.GNOSIS,
  CHAINS_ENUM.AVAX,
];

const chainList = Object.values(CHAINS).sort((a, b) => {
  if (SUPPORT_CHAINS.includes(a.enum) && !SUPPORT_CHAINS.includes(b.enum)) {
    return -1;
  }
  if (SUPPORT_CHAINS.includes(b.enum) && !SUPPORT_CHAINS.includes(a.enum)) {
    return 1;
  }
  return 0;
});

interface Props {
  onChange?: (chain: Chain) => void;
  value?: Chain;
}

export const ChainList: React.FC<Props> = ({ onChange, value }) => {
  return (
    <div
      className={classNames('overflow-y-scroll h-[240px]', styles.scrollbar)}
    >
      {chainList.map((chain) => (
        <ChainItem
          key={chain.enum}
          chain={chain}
          onChange={onChange}
          value={value?.enum === chain.enum}
          isSupported={SUPPORT_CHAINS.includes(chain.enum)}
        />
      ))}
    </div>
  );
};
