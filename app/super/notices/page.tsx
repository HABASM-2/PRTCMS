// app/notices/page.tsx (Server Component – remove "use client")
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import UploadNotice from "./components/UploadNotice";
import ProposalList from "./components/ProposalList";
import { auth } from "@/lib/auth";

export default async function NoticePage() {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    return <div className="p-6">You must be logged in to view this page.</div>;
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Manage Proposal Notices</h1>

      <Tabs defaultValue="upload" className="w-full">
        <TabsList>
          <TabsTrigger value="upload">Upload Notice</TabsTrigger>
          <TabsTrigger value="edit">Edit Notices</TabsTrigger>
        </TabsList>

        <TabsContent value="upload">
          <UploadNotice userId={userId} />
        </TabsContent>

        <TabsContent value="edit">
          <ProposalList userId={userId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
