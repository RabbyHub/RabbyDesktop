import { ButtonProps, Button } from 'antd';
import styles from './BlockButton.module.less';

const BlockButton: React.FC<ButtonProps> = (props) => {
  return (
    <Button {...props} block type="primary" className={styles.BlockButton} />
  );
};
export default BlockButton;
