import { Button, Col, Row } from 'antd';
import { useNavigate } from 'react-router-dom';
import styles from './GettingStarted.module.less';

export default function GettingStarted() {
  const nav = useNavigate();

  return (
    <Row className={styles['page-welcome']} align="middle">
      <Col className={styles.container} span={17} offset={3}>
        <div className={styles['page-content']}>
          <div className={styles.slogan}>
            Specialized client for Dapp security
          </div>
          <div className={styles.slogan}>Rabby Wallet Desktop</div>
        </div>
        <Button
          type="primary"
          className={styles['btn-start']}
          onClick={() => {
            nav('/welcome/import/home');
          }}
        >
          Get started
        </Button>
      </Col>
      <img
        src="rabby-internal://assets/icons/common/logo.svg"
        alt="logo"
        className={styles.logo}
      />
    </Row>
  );
}
