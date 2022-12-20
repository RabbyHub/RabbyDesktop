import { useLocation, useNavigate } from 'react-router-dom';
import BlockButton from './components/BlockButton/BlockButton';
import styles from './ImportSuccessful.module.less';

const ImportSuccessful = () => {
  const nav = useNavigate();
  const { state } = useLocation();

  console.log(state);

  return (
    <div className={styles.ImportSuccessful}>
      <div className={styles.container}>
        <div className={styles.iconWrap}>
          <img
            src="rabby-internal://assets/icons/import/firework.svg"
            alt="successful"
            className={styles.icon}
          />
        </div>
        <h1 className={styles.title}>Imported Successfully</h1>

        <div className={styles.card}>
          <div className={styles.name}>Private Key 1</div>
          <div className={styles.address}>{state.address}</div>
        </div>

        <BlockButton
          onClick={() => {
            nav('/');
          }}
        >
          Done
        </BlockButton>
      </div>
    </div>
  );
};

export default ImportSuccessful;
