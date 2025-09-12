import Image from "next/image";

// import { gothampro } from "@/utils/fonts";

function Footer() {
  return (
    <footer className="w-full max-w-xl mx-auto mt-6 text-center">
      {/* Partner Logos */}
      <div className="flex justify-center items-center gap-6 sm:gap-10 mb-4">
        {/* <Image
          src="/logos/dep.svg"
          alt="Department Logo"
          width={150}
          height={75}
        /> */}
        <Image src="/logos/mos.svg" alt="Moscow Logo" width={150} height={75} />
      </div>

      {/* Support Email */}
      {/* <div className="text-center">
        <p
          className={`text-xl ${gothampro.className}`}
          style={{ color: "#6DAD3A" }}
        >
          Поддержка:{" "}
          <a
            href="mailto:pr@mosgorsport.ru"
            className="underline hover:no-underline transition-all"
            style={{ color: "#6DAD3A" }}
          >
            pr@mosgorsport.ru
          </a>
        </p>
      </div> */}
    </footer>
  );
}

export default Footer;
