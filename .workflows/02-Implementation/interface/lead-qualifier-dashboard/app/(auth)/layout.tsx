import Link from "next/link";
import Image from "next/image";

import { Toaster } from "@/components/ui/sonner";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-full flex-col items-center justify-center bg-secondary/40 px-4 py-12">
      <div className="pointer-events-none absolute inset-0 bg-gradient-glow" />
      <Link href="/" className="relative mb-8">
        <Image
          src="/logo-flinty-cropped.png"
          alt="Flinty"
          width={130}
          height={38}
          priority
          className="h-9 w-auto"
        />
      </Link>
      <div className="card-premium relative w-full max-w-md p-8">{children}</div>
      <Toaster />
    </div>
  );
}
