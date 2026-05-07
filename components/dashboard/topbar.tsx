"use client";

import { useState } from "react";
import { MenuIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Sidebar } from "@/components/dashboard/sidebar";
import { UserMenu } from "@/components/dashboard/user-menu";

export function Topbar({ email }: { email: string }) {
  const [open, setOpen] = useState(false);

  return (
    <header className="bg-background sticky top-0 z-30 flex h-14 items-center justify-between border-b px-4 md:px-6">
      <div className="flex items-center gap-2 md:hidden">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger render={<Button variant="ghost" size="icon-sm" />}>
            <MenuIcon className="size-4" />
            <span className="sr-only">Open navigation</span>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-0">
            <Sidebar className="h-full" />
          </SheetContent>
        </Sheet>
      </div>

      <div className="ml-auto">
        <UserMenu email={email} />
      </div>
    </header>
  );
}
