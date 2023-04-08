import clsx from 'clsx';

const BundleNone = () => (
  <div
    className={clsx(
      'py-[18px] w-full px-[46px]',
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
      'py-[24px] w-full',
      'border border-solid border-[#FFFFFF1A] rounded-[6px]',
      'text-[12px] text-[#FFFFFF4D] text-center font-normal'
    )}
  >
    None
  </div>
);

export const CommonAccountList: React.FC<{
  title: string;
  children: React.ReactNode;
  titleClassName?: string;
  isBundle?: boolean;
}> = ({ children, title, titleClassName, isBundle }) => {
  const hasChildren = Array.isArray(children) && children.length > 0;

  return (
    <section>
      <h2
        className={clsx(
          'mb-[12px]',
          'opacity-50',
          'text-[12px] text-white font-normal',
          titleClassName
        )}
      >
        {title}
      </h2>
      <ul className={clsx('flex flex-col space-y-[12px] p-0')}>
        {hasChildren ? children : isBundle ? <BundleNone /> : <CommonNone />}
      </ul>
    </section>
  );
};
