import TipTag from './TipTag';
import styles from './Tips.module.less';

interface Tip {
  title: string;
  description: string;
}

export interface Props {
  items: Tip[];
}

const Tips: React.FC<Props> = ({ items }) => {
  return (
    <div className={styles.Tips}>
      <TipTag />
      <div className={styles.group}>
        {items.map((item) => (
          <div className={styles.item} key={item.title}>
            <h3 className={styles.title}>{item.title}</h3>
            <p className={styles.description}>{item.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
};
export default Tips;
