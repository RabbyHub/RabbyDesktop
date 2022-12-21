import '@/renderer/css/style.less';

import { Col, Row } from 'antd';
import styles from './ImportHome.module.less';
import ImportItem from './components/ImportItem/ImportItem';

const IMPORT_BY = [
  {
    title: 'Import Private Key',
    path: '/import-by/private-key',
  },
];

const ImportHome = () => {
  return (
    <div className={styles.ImportHome}>
      <Row className={styles.Row}>
        <Col className={styles.LeftView} span={14}>
          <div className={styles.container}>
            <img
              src="rabby-internal://assets/icons/internal-homepage/logo.svg"
              alt="logo"
              className={styles.logo}
            />
            <h1 className={styles.title}>Add an Address</h1>
            <div className={styles.list}>
              {IMPORT_BY.map((item) => (
                <ImportItem key={item.path} {...item} />
              ))}
            </div>
          </div>
        </Col>
        <Col className={styles.RightView} span={10}>
          <div className={styles.container}>
            <img
              src="rabby-internal://assets/icons/import/quote.svg"
              alt="quote"
              className={styles.quote}
            />
            <h1 className={styles.title}>Self-custodial</h1>
            <p className={styles.desc}>
              Private keys are stored locally with sole access to you
            </p>
            <img
              className={styles.picture}
              src="rabby-internal://assets/icons/import/password-box.svg"
              alt="password-box"
            />
          </div>
        </Col>
      </Row>
    </div>
  );
};

export default ImportHome;
