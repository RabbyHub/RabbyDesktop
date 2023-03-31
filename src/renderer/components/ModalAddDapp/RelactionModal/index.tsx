import { Button } from 'antd';

import classNames from 'classnames';
import { DappFavicon } from '../../DappFavicon';
import { Modal } from '../../Modal/Modal';
import styles from './index.module.less';

interface DappCardProps {
  dapp?: IDapp;
}
const DappCard = ({ dapp }: DappCardProps) => {
  return (
    <div className={classNames(styles.dapp)}>
      <DappFavicon
        className={styles.dappIcon}
        origin={dapp?.origin || ''}
        src={dapp?.faviconBase64 ? dapp.faviconBase64 : dapp?.faviconUrl}
      />
      <div className={styles.dappContent}>
        <div className={styles.dappName}>{dapp?.alias}</div>
        <div className={styles.dappOrigin}>
          {dapp?.origin?.replace(/^\w+:\/\//, '')}
        </div>
      </div>
    </div>
  );
};

interface RelationModalProps {
  data: IDapp[];
  open?: boolean;
  onCancel?: () => void;
  onOk?: () => void;
}
export const RelationModal = ({
  data,
  open,
  onCancel,
  onOk,
}: RelationModalProps) => {
  return (
    <Modal
      open={open}
      onCancel={onCancel}
      className={styles.relationModal}
      width={560}
      centered
    >
      <div className={styles.content}>
        <div className={styles.title}>
          You already have a Dapp associated with this domain. Adding a new
          domain will conflict with the existing Dapp. Do you want to replace it
          or cancel?
        </div>
        <div className={styles.body}>
          {data.map((dapp) => {
            return <DappCard key={dapp.origin} dapp={dapp} />;
          })}
        </div>
        <div className={styles.footer}>
          <Button ghost block size="large" onClick={onCancel}>
            Cancel adding
          </Button>
          <Button type="primary" block size="large" onClick={onOk}>
            Confirm to add
          </Button>
        </div>
      </div>
    </Modal>
  );
};
