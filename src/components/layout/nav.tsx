"use client";

import Link from "next/link";
import Image from "next/image";
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
    <header className="bg-white border-b">
      <div className="flex h-16 items-center px-6 gap-6">
        <Link href="/" className="flex items-center group">
          <Image
            src="https://res.cloudinary.com/dovgh19xr/image/upload/v1773243238/GPMLogo_Linear_uld33t.png"
            alt="Golden Proportions Marketing"
            width={200}
            height={40}
            className="h-8 w-auto"
            priority
          />
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
                  "flex items-center gap-2 px-4 py-2 text-base font-medium tracking-wide transition-colors",
                  isActive
                    ? "text-[#66388F] border-b-2 border-[#66388F]"
                    : "text-[#66388F]/60 hover:text-[#66388F]"
                )}
              >
                <Icon className="h-5 w-5" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
