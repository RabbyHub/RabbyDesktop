import styles from './index.module.less';

const list = [
  'uniswap.org',
  'lido.fi',
  'compound.finance',
  'curve.fi',
  'aave.com',
];

interface DomainExampleProps {
  onDomainClick: (domain: string) => void;
}

export const DomainExample = ({ onDomainClick }: DomainExampleProps) => {
  return (
    <div className={styles.container}>
      <div className={styles.label}>Domain examples:</div>
      <div className={styles.list}>
        {list.map((item) => (
          <div
            className={styles.item}
            key={item}
            onClick={() => onDomainClick(item)}
          >
            {item}
          </div>
        ))}
      </div>
    </div>
  );
};
