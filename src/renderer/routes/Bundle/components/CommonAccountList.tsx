import { TipsWrapper } from '@/renderer/components/TipWrapper';
import clsx from 'clsx';

const BundleNone = () => (
  <div
    className={clsx(
      'py-[18px] w-full px-[46px] h-[66px]',
      'bg-[#FFFFFF05] rounded-[6px]',
      'text-[12px] text-[#FFFFFF4D] text-center leading-[15px]'
    )}
  >
    Select addresses from below to include in your Bundle
  </div>
);

const CommonNone = () => (
  <div
    className={clsx(
      'flex items-center justify-center',
      'w-full h-[66px]',
      'border border-solid border-[#FFFFFF1A] rounded-[6px]',
      'text-[12px] text-[#FFFFFF4D] text-center font-normal'
    )}
  >
    None
  </div>
);

interface Props {
  title: string;
  children: React.ReactNode;
  titleClassName?: string;
  isBundle?: boolean;
  onClickAdd?: () => void;
  canAdd?: boolean;
  maxAccount?: number;
  hoverTips?: string;
  clickTips?: string;
}

export const CommonAccountList: React.FC<Props> = ({
  children,
  title,
  titleClassName,
  isBundle,
  onClickAdd,
  canAdd,
  hoverTips,
  clickTips,
}) => {
  const hasChildren = Array.isArray(children) && children.length > 0;

  return (
    <section>
      <div className={clsx('flex justify-between items-center', 'mb-[12px]')}>
        <h2
          className={clsx(
            'opacity-50 mb-0',
            'text-[12px] text-white font-normal',
            titleClassName
          )}
        >
          {title}
        </h2>
        {canAdd && (
          <TipsWrapper
            showConfirmIcon={false}
            hoverTips={hoverTips}
            clickTips={!canAdd ? clickTips : undefined}
            placement="topRight"
            align={{
              targetOffset: [-16, 0],
            }}
          >
            <img
              onClick={onClickAdd}
              className="opacity-60 hover:opacity-100 cursor-pointer"
              src="rabby-internal://assets/icons/bundle/plus.svg"
            />
          </TipsWrapper>
        )}
      </div>
      <ul className={clsx('flex flex-col space-y-[12px]', 'm-0 p-0')}>
        {hasChildren ? children : isBundle ? <BundleNone /> : <CommonNone />}
      </ul>
    </section>
  );
};
