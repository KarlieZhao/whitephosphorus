
type Props = {
    children?: React.ReactNode;
};

const Container = ({ children }: Props) => {
    return <div className={`relative w-1/2 z-10 overflow-scroll scrollbar-hide `}>
        <div className={`container`}>{children}</div>
    </div>
};

export default Container;