"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Pencil, Trash2, Save, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
  DialogTitle,
} from "@/components/ui/dialog";
import { useSession } from "next-auth/react";

type Org = {
  id: number;
  name: string;
  description?: string;
  createdAt: string;
  createdBy: string;
  creator?: {
    id: string;
    fullName?: string | null;
  };
};

export default function AddOrganisation() {
  const { data: session } = useSession();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [orgs, setOrgs] = useState<Org[]>([]);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [tableLoading, setTableLoading] = useState(true);

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editLoading, setEditLoading] = useState(false);

  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);

  const pageSize = 5;

  const fetchData = async () => {
    setTableLoading(true);
    const res = await fetch(`/api/organisations?q=${query}&page=${page}`);
    const data = await res.json();
    setOrgs(data.organisations);
    setTotal(data.total);
    setTableLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [query, page]);

  const handleSubmit = async () => {
    if (!name.trim()) {
      setError("Name is required");
      return;
    }

    setLoading(true);
    setError("");

    const res = await fetch("/api/organisations", {
      method: "POST",
      body: JSON.stringify({ name, description }),
      headers: { "Content-Type": "application/json" },
    });

    if (!res.ok) {
      const errorData = await res.json();
      setError(errorData.error || "Something went wrong");
      setLoading(false);
      return;
    }

    setName("");
    setDescription("");
    setLoading(false);
    fetchData();
  };

  const startEditing = (org: Org) => {
    setEditingId(org.id);
    setEditName(org.name);
    setEditDescription(org.description || "");
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditName("");
    setEditDescription("");
  };

  const saveEdit = async (id: number) => {
    setEditLoading(true);
    await fetch(`/api/organisations/${id}`, {
      method: "PUT",
      body: JSON.stringify({
        name: editName,
        description: editDescription,
      }),
      headers: { "Content-Type": "application/json" },
    });
    setEditLoading(false);
    cancelEditing();
    fetchData();
  };

  const deleteOrg = async (id: number) => {
    await fetch(`/api/organisations/${id}`, {
      method: "DELETE",
    });
    setConfirmDeleteId(null);
    fetchData();
  };

  return (
    <div className="space-y-6">
      {/* Create Form */}
      <div className="space-y-2">
        <Input
          placeholder="Organisation Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <Textarea
          placeholder="Description (optional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <div className="flex gap-4 items-center">
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? "Adding..." : "Add Organisation"}
          </Button>
          {error && <span className="text-red-500 text-sm">{error}</span>}
        </div>
      </div>

      {/* Search */}
      <Input
        className="mt-6"
        placeholder="Search organisation..."
        value={query}
        onChange={(e) => {
          setPage(1);
          setQuery(e.target.value);
        }}
      />

      {/* Table */}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Creator</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tableLoading
            ? [...Array(5)].map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={4}>
                    <div className="flex justify-center py-10">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900 dark:border-white" />
                    </div>
                  </TableCell>
                </TableRow>
              ))
            : orgs.map((org) => (
                <TableRow key={org.id}>
                  <TableCell>
                    {editingId === org.id ? (
                      <Input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                      />
                    ) : (
                      org.name
                    )}
                  </TableCell>
                  <TableCell>
                    {editingId === org.id ? (
                      <Textarea
                        value={editDescription}
                        onChange={(e) => setEditDescription(e.target.value)}
                      />
                    ) : (
                      org.description
                    )}
                  </TableCell>
                  <TableCell>{org.creator?.fullName || "Unknown"}</TableCell>
                  <TableCell className="flex gap-2">
                    {String(session?.user?.id) === String(org.creator?.id) &&
                      (editingId === org.id ? (
                        <>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => saveEdit(org.id)}
                            disabled={editLoading}
                          >
                            {editLoading ? (
                              <span className="text-xs">...</span>
                            ) : (
                              <Save className="w-4 h-4" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={cancelEditing}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => startEditing(org)}
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>

                          <Dialog
                            open={confirmDeleteId === org.id}
                            onOpenChange={(open) =>
                              !open && setConfirmDeleteId(null)
                            }
                          >
                            <DialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setConfirmDeleteId(org.id)}
                              >
                                <Trash2 className="w-4 h-4 text-red-500" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="space-y-4">
                              <DialogTitle>Confirm Delete</DialogTitle>{" "}
                              {/* ✅ REQUIRED for accessibility */}
                              <p>
                                Are you sure you want to delete{" "}
                                <strong>{org.name}</strong>?
                              </p>
                              <div className="flex justify-end gap-2">
                                <Button
                                  variant="outline"
                                  onClick={() => setConfirmDeleteId(null)}
                                >
                                  Cancel
                                </Button>
                                <Button
                                  variant="destructive"
                                  onClick={() => deleteOrg(org.id)}
                                >
                                  Confirm Delete
                                </Button>
                              </div>
                            </DialogContent>
                          </Dialog>
                        </>
                      ))}
                  </TableCell>
                </TableRow>
              ))}
        </TableBody>
      </Table>

      {/* Pagination */}
      <div className="flex justify-between items-center mt-4">
        <Button
          variant="outline"
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={page === 1}
        >
          Previous
        </Button>
        <span>Page {page}</span>
        <Button
          variant="outline"
          onClick={() => setPage((p) => (p * pageSize < total ? p + 1 : p))}
          disabled={page * pageSize >= total}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
