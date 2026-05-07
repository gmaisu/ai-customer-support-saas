"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FolderIcon, SettingsIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/logo";

const navItems = [
  { href: "/dashboard/projects", label: "Projects", icon: FolderIcon },
  { href: "/dashboard/settings", label: "Account", icon: SettingsIcon },
];

export function Sidebar({ className }: { className?: string }) {
  const pathname = usePathname();

  return (
    <aside className={cn("bg-sidebar text-sidebar-foreground flex flex-col border-r", className)}>
      <div className="flex h-14 items-center gap-2 border-b px-4 font-semibold">
        <Logo size={24} />
        <span>Helpforge</span>
      </div>

      <nav className="flex-1 space-y-1 p-2">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "hover:bg-sidebar-accent/50 text-sidebar-foreground",
              )}
            >
              <Icon className="size-4" />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="text-muted-foreground border-t p-3 text-xs">Helpforge MVP · Phase 2</div>
    </aside>
  );
}
