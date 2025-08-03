"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Building, User as UserIcon } from "lucide-react";
import { useState } from "react";
import AddUserForm from "./components/AddUserForm";
import UserTable from "./components/UserTable";

export default function Page() {
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <div className="p-6">
      {/* Set defaultValue to 'user' to auto-load User tab */}
      <Tabs defaultValue="user" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="user" className="flex items-center gap-2">
            <UserIcon className="w-4 h-4" />
            User
          </TabsTrigger>
        </TabsList>

        {/* User Tab Content */}
        <TabsContent value="user">
          {/* Nested tabs inside the user tab */}
          <Tabs defaultValue="addUser" className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="addUser">Add User</TabsTrigger>
              <TabsTrigger value="lists">Lists</TabsTrigger>
            </TabsList>

            {/* Add User Tab */}
            <TabsContent value="addUser">
              <div className="p-4 border rounded-xl shadow-sm bg-muted">
                <h2 className="text-lg font-semibold mb-2">Add User</h2>
                <AddUserForm
                  onSuccess={() => setRefreshKey((prev) => prev + 1)}
                />
              </div>
            </TabsContent>

            {/* Roles Tab */}
            <TabsContent value="lists">
              <div className="p-4 border rounded-xl shadow-sm bg-muted">
                <h2 className="text-lg font-semibold mb-2">
                  Users of system appears here.
                </h2>
                <UserTable />
              </div>
            </TabsContent>
          </Tabs>
        </TabsContent>
      </Tabs>
    </div>
  );
}
