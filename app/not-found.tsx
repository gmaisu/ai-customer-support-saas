import Link from "next/link";
import { CompassIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "Not found — Helpforge",
};

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <div className="max-w-md space-y-4 text-center">
        <div className="bg-muted text-muted-foreground mx-auto flex size-12 items-center justify-center rounded-full">
          <CompassIcon className="size-6" />
        </div>
        <h1 className="text-2xl font-semibold">Lost in the docs</h1>
        <p className="text-muted-foreground text-sm">
          That page doesn&apos;t exist. Here are some places that do.
        </p>
        <div className="flex flex-wrap justify-center gap-2 pt-2">
          <Button render={<Link href="/" />}>Home</Button>
          <Button variant="outline" render={<Link href="/pricing" />}>
            Pricing
          </Button>
          <Button variant="outline" render={<Link href="/dashboard" />}>
            Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
}
