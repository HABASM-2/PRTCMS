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
import { Pencil, Trash2, Save, X, History, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
  DialogTitle,
} from "@/components/ui/dialog";
import { useSession } from "next-auth/react";
import { toast } from "sonner";

type Org = {
  id: number;
  name: string;
  description?: string;
  status: "active" | "inactive";
  createdAt: string;
  createdBy: {
    id: string | number;
    fullName?: string | null;
  };
};

type AddOrganisationProps = {
  userRoles: string[];
};

export default function AddOrganisation({ userRoles }: AddOrganisationProps) {
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

  const [statusDialog, setStatusDialog] = useState<{
    org: Org | null;
    open: boolean;
  }>({ org: null, open: false });
  const [statusReason, setStatusReason] = useState("");
  const [statusLoading, setStatusLoading] = useState(false);

  const [deleteLoadingId, setDeleteLoadingId] = useState<number | null>(null);

  const isSuperUser = userRoles.includes("super");
  const hasOneOrMoreOrgs = orgs.length >= 1;
  const canAddOrganisation = isSuperUser || !hasOneOrMoreOrgs;

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

    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Something went wrong");
      setLoading(false);
      return;
    }

    setName("");
    setDescription("");
    setLoading(false);
    fetchData();
    toast.success("Organisation created successfully");
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
      body: JSON.stringify({ name: editName, description: editDescription }),
      headers: { "Content-Type": "application/json" },
    });
    setEditLoading(false);
    cancelEditing();
    fetchData();
    toast.success("Organisation updated");
  };

  const deleteOrg = async (id: number) => {
    setDeleteLoadingId(id); // Start spinner

    try {
      const res = await fetch(`/api/organisations/${id}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Failed to delete organisation.");
        return;
      }

      toast.success("Organisation deleted");
      fetchData();
    } catch (err) {
      toast.error("Something went wrong while deleting.");
    } finally {
      setConfirmDeleteId(null);
      setDeleteLoadingId(null); // Stop spinner
    }
  };

  const handleStatusChange = (org: Org) => {
    setStatusReason("");
    setStatusDialog({ org, open: true });
  };

  const confirmStatusChange = async () => {
    if (!statusReason.trim() || !statusDialog.org) return;

    setStatusLoading(true);

    await fetch(`/api/organisations/${statusDialog.org.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        newStatus: statusDialog.org.status === "active" ? "inactive" : "active",
        reason: statusReason,
      }),
    });

    setStatusLoading(false);
    setStatusDialog({ org: null, open: false });
    fetchData();
    toast.success("Status updated");
  };

  const showHistory = (org: Org) => {
    toast(
      `${org.name} was created at ${new Date(
        org.createdAt
      ).toLocaleString()} and is currently ${org.status}`
    );
  };

  return (
    <div className="space-y-6">
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
          <Button
            onClick={handleSubmit}
            disabled={loading || !canAddOrganisation}
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              "Add Organisation"
            )}
          </Button>
          {!canAddOrganisation && !isSuperUser && (
            <p className="text-sm text-red-600 mt-2">
              One organisation is allowed to add!
            </p>
          )}
          {error && <span className="text-red-500 text-sm">{error}</span>}
        </div>
      </div>

      <Input
        className="mt-6"
        placeholder="Search organisation..."
        value={query}
        onChange={(e) => {
          setPage(1);
          setQuery(e.target.value);
        }}
      />

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
          {tableLoading ? (
            <TableRow>
              <TableCell colSpan={4}>
                <div className="flex justify-center py-10">
                  <Loader2 className="w-6 h-6 animate-spin" />
                </div>
              </TableCell>
            </TableRow>
          ) : (
            orgs.map((org) => (
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
                <TableCell>{org.createdBy?.fullName || "Unknown"}</TableCell>
                <TableCell className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => showHistory(org)}
                  >
                    <History className="w-4 h-4" />
                  </Button>
                  {String(session?.user?.id) === String(org.createdBy?.id) &&
                    (editingId === org.id ? (
                      <>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => saveEdit(org.id)}
                          disabled={editLoading}
                        >
                          {editLoading ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
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
                            <DialogTitle>Confirm Delete</DialogTitle>
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
                                disabled={deleteLoadingId === org.id}
                              >
                                {deleteLoadingId === org.id ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  "Confirm Delete"
                                )}
                              </Button>
                            </div>
                          </DialogContent>
                        </Dialog>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleStatusChange(org)}
                        >
                          {org.status === "active" ? "Deactivate" : "Activate"}
                        </Button>
                      </>
                    ))}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      <Dialog
        open={statusDialog.open}
        onOpenChange={(open) =>
          !open && setStatusDialog({ org: null, open: false })
        }
      >
        <DialogContent className="space-y-4">
          <DialogTitle>Change Status</DialogTitle>
          <p>
            Provide a reason for changing status of{" "}
            <strong>{statusDialog.org?.name}</strong>
          </p>
          <Textarea
            placeholder="Reason..."
            value={statusReason}
            onChange={(e) => setStatusReason(e.target.value)}
          />
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setStatusDialog({ org: null, open: false })}
            >
              Cancel
            </Button>
            <Button onClick={confirmStatusChange} disabled={statusLoading}>
              {statusLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                "Confirm"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

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
