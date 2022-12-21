import { Col, Row } from 'antd';
import React from 'react';
import Tips, { Props as TipsProps } from '../Tips/Tips';
import BackButton from '../BackButton/BackButton';
import styles from './ImportView.module.less';

interface Props {
  title: string;
  tips: TipsProps['items'];
  children: React.ReactNode;
}

const ImportView: React.FC<Props> = ({ title, children, tips }) => {
  return (
    <div className={styles.ImportView}>
      <Row className={styles.Row}>
        <Col className={styles.LeftView} span={12}>
          <div className={styles.container}>
            <BackButton className={styles.back} />
            <h1 className={styles.title}>{title}</h1>
            {children}
          </div>
        </Col>
        <Col className={styles.RightView} span={12}>
          <div className={styles.container}>
            <Tips items={tips} />
          </div>
        </Col>
      </Row>
    </div>
  );
};

export default ImportView;
