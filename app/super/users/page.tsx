import { redirect } from "next/navigation";
import { auth } from "@/lib/auth"; // your session fetching logic
import Page from "./components/Entry"; // your current client component with tabs

export default async function OrgPageWrapper() {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  const userId = session.user?.id; // <-- add userId from session
  const userRoles = session.user?.roles ?? [];

  // Roles allowed to access organisation page
  const allowedRoles = ["admin", "super", "user-manager"];

  // Check if user has at least one allowed role
  const isAllowed = userRoles.some((role) => allowedRoles.includes(role));

  if (!isAllowed) {
    redirect("/forbidden");
  }

  // Pass userId to your Page component
  return <Page userRoles={userRoles} userId={userId} />;
}
