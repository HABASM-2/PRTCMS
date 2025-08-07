// components/SuperNavMobile.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  User,
  Settings,
  Building,
  Tag,
  Paperclip,
} from "lucide-react";

const navItems = [
  { name: "Dashboard", href: "/super", icon: LayoutDashboard },
  { name: "Organisation", href: "/super/orgs", icon: Building },
  { name: "Users", href: "/super/users", icon: User },
  { name: "Notices", href: "/super/notices", icon: Tag },
  { name: "Proposals", href: "/super/proposals", icon: Paperclip },
  { name: "Settings", href: "/super/settings", icon: Settings },
];

export function SuperNavMobile() {
  const pathname = usePathname();

  return (
    <nav className="md:hidden flex justify-around bg-gray-200 dark:bg-gray-800 text-gray-900 dark:text-white py-2">
      {navItems.map(({ name, href, icon: Icon }) => (
        <Link
          key={name}
          href={href}
          className={cn(
            "flex flex-col items-center text-sm",
            pathname === href && "text-blue-600 dark:text-blue-400"
          )}
        >
          <Icon className="w-5 h-5" />
          {name}
        </Link>
      ))}
    </nav>
  );
}
