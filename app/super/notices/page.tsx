// app/notices/page.tsx
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import UploadNotice from "./components/UploadNotice";
import ProposalList from "./components/ProposalList";
import NoticesTab from "./components/NoticesTab";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function NoticePage() {
  const session = await auth();
  const userId = session?.user?.id;
  const roles = session?.user?.roles || [];
  const numId = Number(userId);

  if (!userId) {
    return <div className="p-6">You must be logged in to view this page.</div>;
  }

  // Fetch user's assigned orgUnits
  const userOrgUnits = await prisma.userOrgUnit.findMany({
    where: { userId: numId },
    select: { orgUnitId: true },
  });
  const userOrgUnitIds = userOrgUnits.map((u) => u.orgUnitId);

  // Determine primary role by hierarchy: dean > coordinator > head > staff
  const roleNames = roles.map((r) => r.toLowerCase());

  let primaryRole = "staff";
  if (roleNames.includes("dean")) primaryRole = "dean";
  else if (roleNames.includes("coordinator")) primaryRole = "coordinator";
  else if (roleNames.includes("head")) primaryRole = "head";

  // Role-based access flags
  const canPostOrEdit = roleNames.includes("director");
  const canViewNotices = ["dean", "coordinator", "head"].some((r) =>
    roleNames.includes(r)
  );

  // Decide which tab should be opened by default
  let defaultTab = "upload";
  if (!canPostOrEdit && canViewNotices) {
    defaultTab = "notices";
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Manage Proposal Notices</h1>

      <Tabs defaultValue={defaultTab} className="w-full">
        <TabsList>
          {canPostOrEdit && (
            <TabsTrigger value="upload">Upload Notice</TabsTrigger>
          )}
          {canPostOrEdit && (
            <TabsTrigger value="edit">Edit Notices</TabsTrigger>
          )}
          {canViewNotices && <TabsTrigger value="notices">Notices</TabsTrigger>}
        </TabsList>

        {canPostOrEdit && (
          <TabsContent value="upload">
            <UploadNotice userId={userId} roles={roles} />
          </TabsContent>
        )}

        {canPostOrEdit && (
          <TabsContent value="edit">
            <ProposalList userId={userId} roles={roles} />
          </TabsContent>
        )}

        {canViewNotices && (
          <TabsContent value="notices">
            <NoticesTab
              userId={numId}
              userOrgUnitIds={userOrgUnitIds}
              userRole={primaryRole}
            />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
