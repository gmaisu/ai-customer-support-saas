import Link from "next/link";
import { Logo } from "@/components/logo";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-muted/30 flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-6">
        <Link href="/" className="flex items-center justify-center gap-2 text-xl font-bold">
          <Logo size={32} />
          <span>Helpforge</span>
        </Link>
        {children}
      </div>
    </div>
  );
}
