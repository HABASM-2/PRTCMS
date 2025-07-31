// UserTable.tsx

"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Pencil, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader } from "@/components/ui/dialog";
import { toast } from "sonner";
import axios from "axios";

interface User {
  id: number;
  fullName: string;
  email: string;
  username: string;
  role?: {
    name: string;
  };
  organisations: {
    id: number;
    name: string;
  }[];
}

export default function UserTable() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState("");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await axios.get("/api/users");
      setUsers(res.data);
    } catch (e) {
      toast.error("Failed to fetch users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleDelete = async (id: number) => {
    try {
      await axios.delete(`/api/users/${id}`);
      toast.success("User deleted");
      fetchUsers();
    } catch (e) {
      toast.error("Delete failed");
    }
  };

  const filteredUsers = users.filter(
    (u) =>
      u.fullName.toLowerCase().includes(filter.toLowerCase()) ||
      u.username.toLowerCase().includes(filter.toLowerCase()) ||
      u.email.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div>
      <div className="flex items-center gap-4 mb-4">
        <Input
          placeholder="Search by name, username or email"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="text-center py-4">Loading...</div>
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
                <TableCell>{user.role?.name || "-"}</TableCell>
                <TableCell>
                  {user.organisations.map((o) => o.name).join(", ")}
                </TableCell>
                <TableCell>
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
                      onClick={() => handleDelete(user.id)}
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>Edit User</DialogHeader>
          {selectedUser && (
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const data = {
                  fullName: formData.get("fullName"),
                  username: formData.get("username"),
                  email: formData.get("email"),
                  password: formData.get("password") || undefined, // Don't send if empty
                };
                try {
                  await axios.put(`/api/users/${selectedUser.id}`, data);
                  toast.success("User updated");
                  setDialogOpen(false);
                  fetchUsers();
                } catch (e) {
                  toast.error("Failed to update user");
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
              <Button type="submit">Save</Button>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
