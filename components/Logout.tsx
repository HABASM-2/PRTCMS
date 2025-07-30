"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

export function LogoutButton() {
  const [isLoading, setIsLoading] = useState(false);

  const handleLogout = async () => {
    setIsLoading(true);
    await signOut({ callbackUrl: `${window.location.origin}/login` });
  };

  return (
    <Button variant="destructive" onClick={handleLogout} disabled={isLoading}>
      {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
      {isLoading ? "Logging out..." : "Logout"}
    </Button>
  );
}
