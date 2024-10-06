import '@/app/globals.css'

export function Footer() {
  return (
    <footer className={`z-0 w-full fixed bottom-0 foot`}>
      <div className="flex flex-col flex-row items-center">
        <h3 className="text-2xl text-gray-100 text-center lg:pr-4 lg:w-1/2">
          Team info
        </h3>
        credit info
      </div>
    </footer>
  );
}

export default Footer;
