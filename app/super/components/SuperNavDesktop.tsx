// components/SuperNavDesktop.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { LayoutDashboard, User, Settings } from "lucide-react";

const navItems = [
  { name: "Dashboard", href: "/super", icon: LayoutDashboard },
  { name: "Users & OrgUnits", href: "/super/users-and-orgunits", icon: User },
  { name: "Settings", href: "/super/settings", icon: Settings },
];

export function SuperNavDesktop() {
  const pathname = usePathname();

  return (
    <nav className="space-y-2">
      {navItems.map(({ name, href, icon: Icon }) => (
        <Link
          key={name}
          href={href}
          className={cn(
            "flex items-center px-3 py-2 rounded-md transition hover:bg-gray-200 dark:hover:bg-gray-800",
            pathname === href && "bg-gray-300 dark:bg-gray-700 font-semibold"
          )}
        >
          <Icon className="w-5 h-5 mr-2" />
          {name}
        </Link>
      ))}
    </nav>
  );
}
