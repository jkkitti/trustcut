import Image from "next/image";
import { cn } from "@/lib/utils";

type TrustCutLogoProps = {
  className?: string;
};

export function TrustCutLogo({ className }: TrustCutLogoProps) {
  return (
    <div className={cn("flex items-center", className)}>
      <Image
        src="/trustcut-logo.png"
        alt="TrustCut logo"
        width={72}
        height={72}
        priority
        className="h-[72px] w-[72px] rounded-[22px] object-cover shadow-sm"
      />
    </div>
  );
}
