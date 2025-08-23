// app/proposals/components/TabsContainer.tsx
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { auth } from "@/lib/auth";
import ProjectsPage from "./components/Mine";

export default async function TabsContainer() {
  const session = await auth();
  const userId = session?.user?.id;
  const roles = session?.user?.roles || [];

  // Normalize role names
  const roleNames = roles.map((r: string) => r.toLowerCase());

  // Role-based access
  const canviewmine = roleNames.includes("user"); // ✅ Only "user" role can submit
  const canViewPart = roleNames.includes("coordinator"); // Status tab
  const canViewFull = roleNames.includes("director");

  return (
    <Tabs defaultValue="mine" className="w-full">
      <TabsList className="mb-4">
        {canviewmine && <TabsTrigger value="mine">Manage Mine</TabsTrigger>}
      </TabsList>

      {canviewmine && (
        <TabsContent value="mine">
          <ProjectsPage userId={Number(userId)} />
        </TabsContent>
      )}
    </Tabs>
  );
}
