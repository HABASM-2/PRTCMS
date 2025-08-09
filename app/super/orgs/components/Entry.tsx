"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Building, User as UserIcon } from "lucide-react";
import { useState } from "react";
import AddOrganisation from "./AddOrganisation";
import OrgStructureEditor from "./OrgStructureEditor";

type PageProps = {
  userRoles: string[];
};

export default function Page({ userRoles }: PageProps) {
  const [orgTab, setOrgTab] = useState("structure");

  // You can now use userRoles to conditionally render tabs, buttons, etc.
  // Example: only allow structure tab if user has "admin" role
  const canAddOrganisation =
    userRoles.includes("admin") || userRoles.includes("super");
  const canViewStructure =
    canAddOrganisation || userRoles.includes("org-manager");

  return (
    <Tabs defaultValue="organisation" className="w-full">
      <TabsList className="mb-6">
        <TabsTrigger value="organisation" className="flex items-center gap-2">
          <Building className="w-4 h-4" />
          Organisation
        </TabsTrigger>
      </TabsList>

      <TabsContent value="organisation">
        <Tabs defaultValue={orgTab} onValueChange={setOrgTab}>
          <TabsList className="mb-4">
            {canViewStructure && (
              <TabsTrigger value="structure">Structure</TabsTrigger>
            )}
            {canAddOrganisation && (
              <TabsTrigger value="add">Add Organisation</TabsTrigger>
            )}
          </TabsList>

          {canViewStructure && (
            <TabsContent value="structure">
              <div className="p-4 border rounded-xl shadow-sm bg-muted">
                <h2 className="text-lg font-semibold mb-2">
                  Organisation Structure
                </h2>
                <OrgStructureEditor />
              </div>
            </TabsContent>
          )}

          {canAddOrganisation && (
            <TabsContent value="add">
              <div className="p-4 border rounded-xl shadow-sm bg-muted">
                <h2 className="text-lg font-semibold mb-2">Add Organisation</h2>
                <AddOrganisation userRoles={userRoles} />
              </div>
            </TabsContent>
          )}
        </Tabs>
      </TabsContent>
    </Tabs>
  );
}
