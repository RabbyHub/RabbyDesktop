import classNames from 'classnames';

export const CommonAccountList: React.FC<{
  title: string;
  children: React.ReactNode;
  titleClassName?: string;
}> = ({ children, title, titleClassName }) => {
  return (
    <section>
      <h2
        className={classNames(
          'mb-[12px]',
          'opacity-50',
          'text-[12px] text-white font-normal',
          titleClassName
        )}
      >
        {title}
      </h2>
      <ul className={classNames('flex flex-col space-y-[12px] p-0')}>
        {children}
      </ul>
    </section>
  );
};
