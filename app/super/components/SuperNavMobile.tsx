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
  {
    name: "Dashboard",
    href: "/super",
    icon: LayoutDashboard,
    roles: ["admin", "super", "user"],
  },
  {
    name: "Organisation",
    href: "/super/orgs",
    icon: Building,
    roles: ["admin", "org-manager", "super"],
  },
  { name: "Users", href: "/super/users", icon: User, roles: ["admin"] },
  {
    name: "Notices",
    href: "/super/notices",
    icon: Tag,
    roles: ["manager"],
  },
  {
    name: "Proposals",
    href: "/super/proposals",
    icon: Paperclip,
    roles: ["user", "manager"],
  },
  {
    name: "Settings",
    href: "/super/settings",
    icon: Settings,
    roles: ["admin", "super", "user", "org-manager"],
  },
];

type SuperNavMobileProps = {
  roles: string[];
};

export function SuperNavMobile({ roles }: SuperNavMobileProps) {
  const pathname = usePathname();

  const allowedNavItems = navItems.filter(({ roles: allowedRoles }) =>
    roles.some((role) => allowedRoles.includes(role))
  );

  return (
    <nav className="md:hidden flex justify-around bg-gray-200 dark:bg-gray-800 text-gray-900 dark:text-white py-2">
      {allowedNavItems.map(({ name, href, icon: Icon }) => (
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
