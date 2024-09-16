import Container from "@/app/_components/container";
import { EXAMPLE_PATH } from "@/lib/constants";

export function Footer() {
  return (
    <div className="bg-gradient-to-b bg-black">
      {/* bg-gradient-to-b from-transparent to-black */}
      {/* <Container> */}
        <div className="py-28 flex flex-col lg:flex-row items-center">
          <h3 className="text-4xl lg:text-[2.5rem] text-gray-100 font-bold tracking-tighter leading-tight text-center lg:text-left mb-10 lg:mb-0 lg:pr-4 lg:w-1/2">
            Team info
          </h3>
             credit info
        </div>
      {/* </Container> */}
    </div>
  );
}

export default Footer;
