// import { TxDisplayItem, TxHistoryItem } from '@/background/service/openapi';
import NameAndAddress from '@/renderer/components/NameAndAddress';
import {
  TxDisplayItem,
  TxHistoryItem,
} from '@rabby-wallet/rabby-api/dist/types';
import classNames from 'classnames';
import { getChain, getTokenSymbol } from '@/renderer/utils';
import styles from '../index.module.less';
import { TxAvatar } from './TxAvatar';

type TxInterAddressExplainProps = {
  data: TxDisplayItem | TxHistoryItem;
} & Pick<TxDisplayItem, 'cateDict' | 'projectDict' | 'tokenDict'>;

export const TxInterAddressExplain = ({
  data,
  projectDict,
  tokenDict,
  cateDict,
}: TxInterAddressExplainProps) => {
  const isCancel = data.cate_id === 'cancel';
  const isApprove = data.cate_id === 'approve';
  const project = data.project_id ? projectDict[data.project_id] : null;
  const chain = getChain(data.chain);

  const projectName = (
    <>
      {project?.name ? (
        project.name
      ) : data.other_addr ? (
        <div className="inline-flex items-center gap-[4px]">
          <NameAndAddress
            address={data.other_addr}
            copyIconClass="w-[14px] h-[14px] cursor-pointer"
            copyIcon={!data.is_scam}
          />
        </div>
      ) : (
        ''
      )}
    </>
  );

  let interAddressExplain;

  if (isCancel) {
    interAddressExplain = (
      <div className={styles.txExplainTitle}>
        Canceled a pending transaction
      </div>
    );
  } else if (isApprove) {
    const tokenId = data.token_approve?.token_id || '';
    const tokenUUID = `${data.chain}_token:${tokenId}`;

    const approveToken = tokenDict[tokenId] || tokenDict[tokenUUID];
    const amount = data.token_approve?.value || 0;

    interAddressExplain = (
      <div className={styles.txExplainTitle}>
        Approve {amount < 1e9 ? amount.toFixed(4) : 'infinite'}{' '}
        {`${getTokenSymbol(approveToken)} for `}
        {projectName}
      </div>
    );
  } else {
    interAddressExplain = (
      <>
        <div className={styles.txExplainTitle}>
          {cateDict[data.cate_id || '']?.name ??
            (data.tx?.name || 'Contract Interaction')}
        </div>
        <div className={styles.txExplainDesc}>{projectName}</div>
      </>
    );
  }

  return (
    <div className={classNames(styles.txExplain, styles.colTxExplain)}>
      <div className={styles.txAvatarContainer}>
        <TxAvatar
          src={projectDict[data.project_id as string]?.logo_url}
          cateId={data.cate_id}
          className={styles.txAvatar}
        />
        {chain?.logo && (
          <img className={styles.txAvatarBadge} src={chain?.logo} alt="" />
        )}
      </div>
      <div className={styles.txExplainBody}>{interAddressExplain}</div>
    </div>
  );
};
