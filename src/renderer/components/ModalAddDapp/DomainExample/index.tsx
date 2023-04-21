import styles from './index.module.less';

interface DomainExampleProps {
  onDomainClick: (domain: string) => void;
  title: string;
  domains: string[];
}

export const DomainExample = ({
  onDomainClick,
  title,
  domains,
}: DomainExampleProps) => {
  return (
    <div className={styles.container}>
      <div className={styles.label}>{title}</div>
      <div className={styles.list}>
        {domains.map((item) => (
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
