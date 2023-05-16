import classNames from 'classnames';

// @ts-expect-error
import ReactMarkdown from 'react-markdown';
// @ts-expect-error
import remarkGfm from 'remark-gfm';
import styles from './index.module.less';

export default function ChangeLogContent({
  className,
  children,
}: React.PropsWithChildren<{
  className?: string;
}>) {
  return (
    <div className={classNames(styles.changeLogContent, className)}>
      {/* @ts-expect-error */}
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{children}</ReactMarkdown>
    </div>
  );
}
