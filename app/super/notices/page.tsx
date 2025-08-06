// app/notices/page.tsx

"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import UploadNotice from "./components/UploadNotice";
import EditNotices from "./components/EditNotices";

export default function NoticePage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Manage Proposal Notices</h1>

      <Tabs defaultValue="upload" className="w-full">
        <TabsList>
          <TabsTrigger value="upload">Upload Notice</TabsTrigger>
          <TabsTrigger value="edit">Edit Notices</TabsTrigger>
        </TabsList>

        <TabsContent value="upload">
          <UploadNotice />
        </TabsContent>

        <TabsContent value="edit">
          <EditNotices />
        </TabsContent>
      </Tabs>
    </div>
  );
}
``;
