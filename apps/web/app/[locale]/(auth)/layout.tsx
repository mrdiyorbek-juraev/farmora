import Image from "next/image";
import type { AuthLayoutProps } from "@/types/auth";

const AuthLayout = ({ children }: AuthLayoutProps) => (
  <div className="flex min-h-svh flex-col p-6 md:p-10">
    <div className="flex items-center gap-2">
      <Image alt="Farmora logo" height={24} src="/icons/logo.svg" width={24} />
      <span className="font-semibold text-base tracking-tight">Farmora</span>
    </div>
    <div className="flex flex-1 items-center justify-center">
      <div className="w-full max-w-xs">{children}</div>
    </div>
  </div>
);

export default AuthLayout;
