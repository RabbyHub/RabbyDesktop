import RabbyInput from '@/renderer/components/AntdOverwrite/Input';
import { useBundle } from '@/renderer/hooks/useBundle/useBundle';
import clsx from 'clsx';
import React from 'react';

export interface Props {
  canEdit?: boolean;
  data: BundleAccount;
  textClassName?: string;
  inputClassName?: string;
}

export const NicknameInput: React.FC<Props> = ({
  canEdit,
  data,
  textClassName,
  inputClassName,
}) => {
  const [nickname, setNickname] = React.useState<string>(data.nickname);
  const {
    account: { updateNickname },
  } = useBundle();
  const [edit, setEdit] = React.useState(false);
  const onClickEdit = React.useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      e.stopPropagation();
      setEdit(true);
    },
    []
  );

  const onUpdateNickname = React.useCallback(
    async (e: any) => {
      if (e.type === 'keydown' && e.keyCode !== 13) {
        return;
      }
      await updateNickname(data.id, nickname);
      setNickname(nickname);
      setEdit(false);
    },
    [data.id, nickname, updateNickname]
  );

  React.useEffect(() => {
    setNickname(data.nickname);
  }, [data.nickname]);

  return (
    <div
      className={clsx(
        'flex items-center space-x-[3px]',
        'font-medium text-[12px] leading-[16px]',
        textClassName ? '' : 'opacity-70',
        canEdit && 'group-hover:opacity-100 hover:opacity-100',
        'group'
      )}
      onClick={onClickEdit}
    >
      {edit ? (
        <div>
          <RabbyInput
            onChange={(e) => setNickname(e.target.value)}
            onBlur={onUpdateNickname}
            onKeyDownCapture={onUpdateNickname}
            autoFocus
            value={nickname}
            className={clsx(
              'w-[120px] bg-[#FFFFFF08] border-[#FFFFFF40] text-white',
              'h-[19px] px-[2px]',
              inputClassName || 'text-[12px]'
            )}
          />
        </div>
      ) : (
        <>
          <span className={clsx('leading-[19px]', textClassName)}>
            {nickname}
          </span>
          {canEdit && (
            <img
              className={clsx('w-[16px]', 'group-hover:block hidden')}
              src="rabby-internal://assets/icons/bundle/edit.svg"
            />
          )}
        </>
      )}
    </div>
  );
};
