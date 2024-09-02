import styles from './mapembed.module.css';

type Props = {
  children?: React.ReactNode;
};

const Container = ({ children }: Props) => {
  return <div className={`${styles.backdrop}`}> 
    <div className={`container mx-auto ${styles.mainContent}`}>{children}</div>;
  </div>
};

export default Container;
