import Image from "next/image";

interface LogoProps {
  className?: string;
}

export default function Logo({ className = "" }: LogoProps) {
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <Image
        src="/assets/logos/AMRECCO_logo.png"
        alt="Amrecco Logo"
        width={300}
        height={40}
        priority
      />
    </div>
  );
}
