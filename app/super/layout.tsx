import "@/app/globals.css";
import { ReactNode } from "react";
import { redirect } from "next/navigation";
import { LogoutButton } from "@/components/Logout";
import { SuperNavDesktop } from "./components/SuperNavDesktop";
import { SuperNavMobile } from "./components/SuperNavMobile";
import { Toaster } from "sonner";
import { auth } from "@/lib/auth";

import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { ChevronDown, Mail, ShieldCheck, User } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";

type Props = {
  children: ReactNode;
};

export default async function SuperLayout({ children }: Props) {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  const user = session.user;

  if (!user?.id || !user?.roles?.length) {
    console.warn("User session is missing id or roles. Redirecting.");
    redirect("/login");
  }
  console.log("SuperLayout session:", session);

  const { name, email, roles, id } = session.user;

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-white text-gray-900 dark:bg-gray-950 dark:text-white transition-colors">
      {/* Sidebar (desktop) */}
      <aside className="hidden md:flex md:w-64 bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-white flex-col p-6 space-y-6 transition-colors">
        {/* Title + Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center space-x-2 text-xl font-bold tracking-wide">
              <User className="w-5 h-5" />
              <span className="text-xl">{name}</span>
              <ChevronDown className="w-4 h-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-60 mt-2">
            <DropdownMenuItem>
              <Mail className="w-4 h-4 mr-2" />
              {email}
            </DropdownMenuItem>
            {roles?.map((r) => (
              <DropdownMenuItem key={r}>
                <ShieldCheck className="w-4 h-4 mr-2" />
                {r}
              </DropdownMenuItem>
            ))}
            <DropdownMenuItem>
              <User className="w-4 h-4 mr-2" />
              ID: {id}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <LogoutButton />
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Navigation */}
        <SuperNavDesktop />

        {/* Bottom Controls */}
        <div className="mt-auto hidden md:flex items-center space-x-3 justify-between">
          <LogoutButton />
          <ThemeToggle />
        </div>
      </aside>

      {/* Mobile Top Bar */}
      <header className="md:hidden bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-white p-4 flex items-center justify-between">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center space-x-2 text-lg font-bold">
              <User className="w-5 h-5" />
              <span>{name}</span>
              <ChevronDown className="w-4 h-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56">
            <DropdownMenuItem>
              <Mail className="w-4 h-4 mr-2" />
              {email}
            </DropdownMenuItem>
            {roles?.map((r) => (
              <DropdownMenuItem key={r}>
                <ShieldCheck className="w-4 h-4 mr-2" />
                {r}
              </DropdownMenuItem>
            ))}
            <DropdownMenuItem>
              <User className="w-4 h-4 mr-2" />
              ID: {id}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <LogoutButton />
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="flex items-center space-x-3">
          <ThemeToggle />
        </div>
      </header>

      {/* Mobile Nav */}
      <SuperNavMobile />

      {/* Main Content */}
      <main className="flex-1 p-6">
        {children}
        <Toaster richColors />
      </main>
    </div>
  );
}
