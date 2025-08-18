// components/SuperNavDesktop.tsx
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
    roles: ["admin", "super", "user", "manager", "org-manager"],
  },
  {
    name: "Organisation",
    href: "/super/orgs",
    icon: Building,
    roles: ["admin", "org-manager", "super"],
  },
  {
    name: "Users",
    href: "/super/users",
    icon: User,
    roles: ["admin", "user-manager", "super"],
  },
  {
    name: "Notices",
    href: "/super/notices",
    icon: Tag,
    roles: [
      "technology-transfer",
      "community-service",
      "research-and-publications",
      "dean",
      "coordinator",
      "head",
    ],
  },
  {
    name: "Proposals",
    href: "/super/proposals",
    icon: Paperclip,
    roles: ["user", "manager", "dean", "head", "coordinator"],
  },
  {
    name: "Settings",
    href: "/super/settings",
    icon: Settings,
    roles: ["admin", "super", "user", "org-manager"],
  },
];

type SuperNavDesktopProps = {
  roles: string[];
};

export function SuperNavDesktop({ roles }: SuperNavDesktopProps) {
  const pathname = usePathname();

  // Filter nav items where any of the user's roles match allowed roles
  const allowedNavItems = navItems.filter(({ roles: allowedRoles }) =>
    roles.some((role) => allowedRoles.includes(role))
  );

  return (
    <nav className="space-y-2">
      {allowedNavItems.map(({ name, href, icon: Icon }) => (
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
