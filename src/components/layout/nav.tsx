"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  Settings,
} from "lucide-react";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/clients", label: "Clients", icon: Users },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function MainNav() {
  const pathname = usePathname();

  return (
    <header className="bg-gp-smokey text-white">
      <div className="flex h-14 items-center px-6 gap-6">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="h-8 w-8 bg-gp-teal flex items-center justify-center">
            <span className="text-white text-xs font-bold font-[family-name:var(--font-display)]">IM</span>
          </div>
          <span className="font-[family-name:var(--font-display)] text-lg uppercase tracking-wider text-white">
            Index Mapper
          </span>
        </Link>

        <nav className="flex items-center gap-1 ml-6">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-2 px-3 py-1.5 text-sm uppercase tracking-wide transition-colors font-[family-name:var(--font-display)]",
                  isActive
                    ? "text-gp-teal border-b-2 border-gp-teal"
                    : "text-white/70 hover:text-white"
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
