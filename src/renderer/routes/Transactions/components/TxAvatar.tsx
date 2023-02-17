// import { IconApproval, IconCancel, IconContract, IconSend } from '@/ui/assets';
import { memo, useMemo } from 'react';

interface TxAvatarProps {
  className?: string;
  src?: string | null;
  cateId?: string | null;
}
export const TxAvatar = memo(({ src, cateId, className }: TxAvatarProps) => {
  const imgURL = useMemo(() => {
    if (src) {
      return src;
    }
    if (cateId === 'send') {
      return 'rabby-internal://assets/icons/transaction/tx-send.svg';
    }
    if (cateId === 'receive') {
      return 'rabby-internal://assets/icons/transaction/tx-receive.svg';
    }
    if (cateId === 'cancel') {
      return 'rabby-internal://assets/icons/transaction/tx-cancel.svg';
    }
    return 'rabby-internal://assets/icons/transaction/tx-unknown.svg';
  }, [src, cateId]);

  return <img src={imgURL} alt="" className={className} />;
});
