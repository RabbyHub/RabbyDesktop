import { useState } from 'react';
import { Button } from 'antd';

import { Modal as RModal } from '@/renderer/components/Modal/Modal';
import { useSystemReleaseInfo } from '@/renderer/hooks/useSystemInfo';
import styles from './index.module.less';

export default function TipUnsupportedModal() {
  const [haveShown, setHaveShown] = useState(false);
  const systemReleaseInfo = useSystemReleaseInfo();

  if (!systemReleaseInfo.isDeprecated) return null;

  return (
    <RModal
      open={!haveShown && systemReleaseInfo.isDeprecated}
      centered
      className={styles.TipUnsupportedModal}
      mask
      width={600}
      onCancel={() => {
        setHaveShown(true);
      }}
    >
      <div className={styles.TipUnsupportedModalInner}>
        <div className={styles.title}>
          Your operating system is not supported
        </div>

        <p className={styles.intro}>
          Please install Rabby Wallet on {systemReleaseInfo.aboveText} <br />
          Stability and user experience cannot be guaranteed on other version
        </p>

        <div className="flex justify-center items-center mt-[70px]">
          <Button
            type="primary"
            className={styles.button}
            onClick={() => {
              setHaveShown(true);
            }}
          >
            I know
          </Button>
        </div>
      </div>
    </RModal>
  );
}
