// app/proposals/components/TabsContainer.tsx
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { auth } from "@/lib/auth";
import ProjectsPage from "./components/Mine";
import ManagePage from "./components/Manage"; // <-- new page for Manage tab

export default async function TabsContainer() {
  const session = await auth();
  const userId = session?.user?.id;
  const roles = session?.user?.roles || [];

  // Normalize role names for easier comparison
  const roleNames = roles.map((r: string) => r.toLowerCase());

  // Role-based access
  const canViewMine = roleNames.includes("user"); // Can submit/view their own proposals
  const canViewPart = roleNames.includes("coordinator"); // Can view partial/manage
  const canViewFull = roleNames.includes("director"); // Full access

  return (
    <Tabs defaultValue={canViewMine ? "mine" : "manage"} className="w-full">
      <TabsList className="mb-4">
        {canViewMine && <TabsTrigger value="mine">Manage Mine</TabsTrigger>}
        {(canViewPart || canViewFull) && (
          <TabsTrigger value="manage">Manage</TabsTrigger>
        )}
      </TabsList>

      {canViewMine && (
        <TabsContent value="mine">
          <ProjectsPage userId={Number(userId)} />
        </TabsContent>
      )}

      {(canViewPart || canViewFull) && (
        <TabsContent value="manage">
          <ManagePage userId={Number(userId)} roles={roles} />
        </TabsContent>
      )}
    </Tabs>
  );
}
