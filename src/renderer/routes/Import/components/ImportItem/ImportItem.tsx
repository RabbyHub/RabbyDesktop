import '@/renderer/css/style.less';
import { useNavigate } from 'react-router-dom';

import styles from './ImportItem.module.less';

interface Props {
  title: string;
  path: string;
}

const ImportItem: React.FC<Props> = ({ title, path }) => {
  const navigate = useNavigate();

  return (
    <div
      className={styles.item}
      onClick={() => {
        navigate(path);
      }}
    >
      <img
        src="rabby-internal://assets/icons/import/key.svg"
        alt="key"
        className={styles.icon}
      />
      <div className={styles.title}>{title}</div>

      <img
        src="rabby-internal://assets/icons/import/arrow-right.svg"
        alt="arrow-right"
        className={styles.icon}
      />
    </div>
  );
};

export default ImportItem;
