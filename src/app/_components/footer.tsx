import styles from './mapembed.module.css';

export function Footer() {
  return (
    <div className={`z-0 ${styles.foot}`}>
        <div className=" px-28 py-10 flex flex-col lg:flex-row items-center">
          <h3 className="text-2xl text-gray-100 font-bold tracking-tighter leading-tight text-center lg:text-left lg:pr-4 lg:w-1/2">
            Team info
          </h3>
             credit info
        </div>
    </div>
  );
}

export default Footer;
