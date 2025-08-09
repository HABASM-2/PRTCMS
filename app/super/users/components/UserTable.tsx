"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import OrgUnitTreeSelector from "./OrgUnitTreeSelector2";
import { Loader2, Pencil, Trash2 } from "lucide-react";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import axios from "axios";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

interface User {
  id: number;
  fullName: string;
  email: string;
  username: string;
  roles?: { id: number; name: string }[];
  organisations: { id: number; name: string }[];
  createdById: String;
  UserOrgUnit?: {
    orgUnit: { id: number; name: string; parentId?: number | null };
  }[];
  managerTag?: string; // ✅ Add this if managerTag is expected on user
}

interface OrgUnit {
  id: number;
  name: string;
  parentId?: number | null;
  children?: OrgUnit[];
}
type PageProps = {
  userId: string;
  userRoles: String[];
};

export default function UserTable({ userRoles, userId }: PageProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState("");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const [roles, setRoles] = useState<{ id: number; name: string }[]>([]);
  const [selectedRoleIds, setSelectedRoleIds] = useState<number[]>([]);

  const [orgUnitTree, setOrgUnitTree] = useState<OrgUnit[]>([]);
  const [selectedOrgUnitIds, setSelectedOrgUnitIds] = useState<number[]>([]);
  const [orgUnitLoading, setOrgUnitLoading] = useState(false);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [organisations, setOrganisations] = useState<
    { id: number; name: string }[]
  >([]);
  const [selectedOrgId, setSelectedOrgId] = useState<number | null>(null);

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10); // You can allow user to change this
  const [total, setTotal] = useState(0);

  const [search, setSearch] = useState("");
  const [managerTag, setManagerTag] = useState("");

  const fetchUsers = async () => {
    setLoading(true); // <-- Start loading
    try {
      const params: Record<string, string> = {
        page: page.toString(),
        limit: limit.toString(),
      };
      if (search) params.search = search;
      if (selectedOrgId !== null)
        params.organisationId = selectedOrgId.toString();

      const res = await axios.get("/api/users", { params });
      setUsers(res.data.users);
      setTotal(res.data.total);
    } catch (err) {
      console.error("Error fetching users:", err);
    } finally {
      setLoading(false); // <-- Stop loading
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [search, selectedOrgId, page]);

  useEffect(() => {
    axios.get("/api/roles").then((res) => setRoles(res.data));
    axios
      .get("/api/organisations/select")
      .then((res) => setOrganisations(res.data));
  }, []);

  useEffect(() => {
    const loadOrgUnits = async () => {
      setOrgUnitTree([]);
      setSelectedOrgUnitIds([]);

      const orgId = selectedUser?.organisations?.[0]?.id;
      const url = `/api/orgunits/trees?${
        selectedUser?.organisations?.[0]?.id
          ? `organisationId=${selectedUser.organisations[0].id}&`
          : ""
      }userId=${selectedUser?.id}`;

      setOrgUnitLoading(true);
      try {
        const res = await axios.get(url);
        setOrgUnitTree(res.data.tree || []);
        setSelectedOrgUnitIds(res.data.assignedOrgUnitIds || []);
      } catch {
        toast.error("Failed to load organisation units");
      } finally {
        setOrgUnitLoading(false);
      }
    };

    if (selectedUser) {
      setSelectedRoleIds(
        Array.isArray(selectedUser.roles)
          ? selectedUser.roles.map((r) => r.id)
          : []
      );

      // ✅ Set manager tag if the user is a manager
      const manager = selectedUser.roles?.find(
        (r) => r.name.toLowerCase() === "manager"
      );
      setManagerTag(
        manager && "managerTag" in selectedUser
          ? (selectedUser as any).managerTag || ""
          : ""
      );

      loadOrgUnits();
    }
  }, [selectedUser]);

  const filteredUsers = users.filter(
    (u) =>
      u.fullName.toLowerCase().includes(filter.toLowerCase()) ||
      u.username.toLowerCase().includes(filter.toLowerCase()) ||
      u.email.toLowerCase().includes(filter.toLowerCase())
  );

  const handleDelete = async () => {
    if (!userToDelete) return;
    setDeleting(true);

    try {
      await axios.delete(`/api/users/${userToDelete.id}`);
      toast.success("User deleted");
      fetchUsers();
      setDeleteDialogOpen(false);
    } catch {
      toast.error("Failed to delete user");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div>
      {/* Filter Controls */}
      <div className="flex flex-col md:flex-row items-start md:items-center gap-4 mb-4">
        <Input
          placeholder="Search users"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-sm"
        />
        <Select
          value={selectedOrgId !== null ? selectedOrgId.toString() : "all"}
          onValueChange={(val) => {
            setSelectedOrgId(val === "all" ? null : Number(val));
          }}
        >
          <SelectTrigger className="w-[250px]">
            <SelectValue placeholder="Filter by organisation" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Organisations</SelectItem>
            {organisations.map((org) => (
              <SelectItem key={org.id} value={org.id.toString()}>
                {org.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Username</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Organisations</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.map((user) => (
              <TableRow key={user.id}>
                <TableCell>{user.fullName}</TableCell>
                <TableCell>{user.username}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {user.roles?.map((role) => {
                      const isManager = role.name.toLowerCase() === "manager";
                      return (
                        <span
                          key={role.id}
                          className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full"
                        >
                          {isManager && user.managerTag
                            ? `${role.name} (${user.managerTag})`
                            : role.name}
                        </span>
                      );
                    }) || "-"}
                  </div>
                </TableCell>
                <TableCell>
                  {user.UserOrgUnit && user.UserOrgUnit.length > 0
                    ? user.UserOrgUnit.filter(
                        (uo) =>
                          !user.UserOrgUnit?.some(
                            (other) => other.orgUnit.parentId === uo.orgUnit.id
                          )
                      )
                        .map((uo) => uo.orgUnit.name)
                        .join(", ")
                    : user.organisations?.[0]?.name || "-"}
                </TableCell>
                <TableCell>
                  {userId == user.createdById && (
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setSelectedUser(user);
                          setDialogOpen(true);
                        }}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setUserToDelete(user);
                          setDeleteDialogOpen(true);
                        }}
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
      <div className="flex justify-between items-center mt-4">
        <span className="text-sm text-muted-foreground">
          Page {page} of {Math.ceil(total / limit)}
        </span>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page === 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= Math.ceil(total / limit)}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </Button>
        </div>
      </div>

      {/* Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
          </DialogHeader>

          {selectedUser && (
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                setSaving(true);
                const formData = new FormData(e.currentTarget);
                const data = {
                  fullName: formData.get("fullName"),
                  username: formData.get("username"),
                  email: formData.get("email"),
                  password: formData.get("password") || undefined,
                  roleIds: selectedRoleIds,
                  orgUnitIds: selectedOrgUnitIds,
                  managerTag: selectedRoleIds.some(
                    (id) =>
                      roles.find((r) => r.id === id)?.name.toLowerCase() ===
                      "manager"
                  )
                    ? managerTag
                    : null,
                  organisationIds:
                    selectedUser?.organisations?.map((o) => o.id) ?? [],
                };

                try {
                  await axios.put(`/api/users/${selectedUser.id}`, data);
                  toast.success("User updated");
                  setDialogOpen(false);
                  fetchUsers();
                } catch {
                  toast.error("Failed to update user");
                } finally {
                  setSaving(false);
                }
              }}
              className="space-y-4"
            >
              <Input
                name="fullName"
                defaultValue={selectedUser.fullName}
                placeholder="Full Name"
              />
              <Input
                name="username"
                defaultValue={selectedUser.username}
                placeholder="Username"
              />
              <Input
                name="email"
                defaultValue={selectedUser.email}
                placeholder="Email"
              />
              <Input name="password" placeholder="New Password (optional)" />

              <div>
                <p className="font-semibold mb-1">Assign Roles</p>
                <div className="border rounded-md p-3 space-y-2 max-h-40 overflow-y-auto">
                  {roles.map((role) => {
                    const isManager = role.name.toLowerCase() === "manager";
                    const checked = selectedRoleIds.includes(role.id);

                    return (
                      <div key={role.id} className="flex items-center gap-2">
                        <Checkbox
                          id={`edit-role-${role.id}`}
                          checked={checked}
                          onCheckedChange={(checked) => {
                            setSelectedRoleIds((prev) =>
                              checked
                                ? [...prev, role.id]
                                : prev.filter((id) => id !== role.id)
                            );
                          }}
                        />
                        <Label
                          htmlFor={`edit-role-${role.id}`}
                          className="text-sm"
                        >
                          {role.name}
                        </Label>

                        {/* ✅ Show Manager Tag Input if selected */}
                        {isManager && checked && (
                          <Input
                            placeholder="Manager Tag"
                            className="ml-2 h-8 w-60"
                            value={managerTag}
                            onChange={(e) => setManagerTag(e.target.value)}
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div>
                <p className="font-semibold mb-1">Assign Organisation Units</p>
                {orgUnitLoading ? (
                  <div className="flex items-center text-muted-foreground text-sm">
                    <Loader2 className="animate-spin w-4 h-4 mr-2" />
                    Loading organisation units...
                  </div>
                ) : orgUnitTree.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No organisation units found.
                  </p>
                ) : (
                  <OrgUnitTreeSelector
                    tree={orgUnitTree}
                    selectedIds={selectedOrgUnitIds}
                    onChange={setSelectedOrgUnitIds}
                  />
                )}
              </div>

              <Button type="submit" disabled={saving}>
                {saving ? "Saving..." : "Save"}
              </Button>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Delete</DialogTitle>
          </DialogHeader>
          <p>
            Are you sure you want to delete{" "}
            <strong>{userToDelete?.fullName}</strong>?
          </p>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="ghost" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? (
                <Loader2 className="animate-spin w-4 h-4" />
              ) : (
                "Delete"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
