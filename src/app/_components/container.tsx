import styles from './mapembed.module.css';

type Props = {
  children?: React.ReactNode;
};

const Container = ({ children }: Props) => {
  return <div className={`${styles.containerSection} relative w-1/2 z-10 overflow-scroll scrollbar-hide `}> 
  <div className={`${styles.backdrop}`}>
    <div className={`container ${styles.mainContent}`}>{children}</div>
    </div>
  </div>
};

export default Container;