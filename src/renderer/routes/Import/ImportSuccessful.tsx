import { AddressItem } from '@/renderer/components/AddressItem/AddressItem';
import { useLocation, useNavigate } from 'react-router-dom';
import BlockButton from './components/BlockButton/BlockButton';
import styles from './ImportSuccessful.module.less';

const ImportSuccessful = () => {
  const nav = useNavigate();
  const { state } = useLocation();
  const { accounts } = state;

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

        <div className={styles.addressList}>
          {accounts.map((account: any) => (
            <AddressItem {...account} key={account.address} />
          ))}
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
