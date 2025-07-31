"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Building, User as UserIcon } from "lucide-react";
import { useState } from "react";
import AddOrganisation from "./components/AddOrganisation";
import OrgStructureEditor from "./components/OrgStructureEditor";
import AddUserForm from "./components/AddUserForm";
import UserTable from "./components/UserTable";

export default function Page() {
  const [orgTab, setOrgTab] = useState("add");
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <div className="p-6">
      <Tabs defaultValue="organisation" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="organisation" className="flex items-center gap-2">
            <Building className="w-4 h-4" />
            Organisation
          </TabsTrigger>
          <TabsTrigger value="user" className="flex items-center gap-2">
            <UserIcon className="w-4 h-4" />
            User
          </TabsTrigger>
        </TabsList>

        {/* Organisation Tabs */}
        <TabsContent value="organisation">
          <Tabs defaultValue={orgTab} onValueChange={setOrgTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="add">Add Organisation</TabsTrigger>
              <TabsTrigger value="structure">Structure</TabsTrigger>
            </TabsList>

            <TabsContent value="add">
              <div className="p-4 border rounded-xl shadow-sm bg-muted">
                <h2 className="text-lg font-semibold mb-2">Add Organisation</h2>
                {/* Add Organisation form here */}
                <AddOrganisation />
              </div>
            </TabsContent>

            <TabsContent value="structure">
              <div className="p-4 border rounded-xl shadow-sm bg-muted">
                <h2 className="text-lg font-semibold mb-2">
                  Organisation Structure
                </h2>
                {/* Tree structure or layout here */}
                <OrgStructureEditor />
              </div>
            </TabsContent>
          </Tabs>
        </TabsContent>

        {/* User Tab Content */}
        <TabsContent value="user">
          <Tabs defaultValue="addUser" className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="addUser">Add User</TabsTrigger>
              <TabsTrigger value="roles">Roles</TabsTrigger>
            </TabsList>

            {/* Add User Tab */}
            <TabsContent value="addUser">
              <div className="p-4 border rounded-xl shadow-sm bg-muted">
                <h2 className="text-lg font-semibold mb-2">Add User</h2>
                {/* Add User form will go here */}
                <AddUserForm
                  onSuccess={() => setRefreshKey((prev) => prev + 1)}
                />
                <UserTable refreshTrigger={refreshKey} />
              </div>
            </TabsContent>

            {/* Roles Tab */}
            <TabsContent value="roles">
              <div className="p-4 border rounded-xl shadow-sm bg-muted">
                <h2 className="text-lg font-semibold mb-2">Roles</h2>
                {/* Roles management will go here */}
                <p>List of roles and functionality to add/edit/delete roles.</p>
              </div>
            </TabsContent>
          </Tabs>
        </TabsContent>
      </Tabs>
    </div>
  );
}
