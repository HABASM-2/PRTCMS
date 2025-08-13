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
import {
  Dialog,
  DialogContent,
  DialogTrigger,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Pencil, Trash2, Loader2, Eye } from "lucide-react";
import EditNoticeForm from "./EditNoticeForm";

function ViewNoticeModal({
  notice,
  open,
  onOpenChange,
}: {
  notice: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg sm:max-w-2xl overflow-y-auto max-h-[90vh]">
        <DialogTitle>Proposal Notice Details</DialogTitle>
        <div className="space-y-4 text-sm mt-2">
          <div>
            <strong>Title:</strong> {notice.title}
          </div>
          {notice.description && (
            <div>
              <strong>Description:</strong>
              <p className="whitespace-pre-wrap">{notice.description}</p>
            </div>
          )}
          <div>
            <strong>Submitted By:</strong> {notice.createdBy?.fullName || "N/A"}
          </div>
          <div>
            <strong>Organisation Unit:</strong> {notice.orgUnit?.name || "N/A"}
          </div>
          <div>
            <strong>Created At:</strong>{" "}
            {new Date(notice.createdAt).toLocaleString()}
          </div>
          <div>
            <strong>Expires At:</strong>{" "}
            {notice.expiredAt
              ? new Date(notice.expiredAt).toLocaleString()
              : "N/A"}
          </div>
          {notice.fileUrl && (
            <div>
              <strong>Attached File:</strong>{" "}
              <a
                href={notice.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="underline text-blue-600 hover:text-blue-800"
              >
                View / Download
              </a>
            </div>
          )}
        </div>
        <DialogFooter className="mt-6">
          <Button onClick={() => onOpenChange(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
interface ProposalListProps {
  userId: string;
  roles: string[];
}

export default function ProposalList({ userId, roles }: ProposalListProps) {
  const [notices, setNotices] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const pageSize = 10;

  const [editingNotice, setEditingNotice] = useState<any | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // View modal state
  const [viewingNotice, setViewingNotice] = useState<any | null>(null);

  const fetchNotices = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/notices?q=${encodeURIComponent(
          query
        )}&page=${page}&pageSize=${pageSize}`
      );
      if (!res.ok) throw new Error("Failed to fetch notices");
      const data = await res.json();
      setNotices(data.notices);
      setTotal(data.total);
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotices();
  }, [query, page]);

  const totalPages = Math.ceil(total / pageSize);

  const handleDelete = async () => {
    if (!deletingId) return;
    try {
      const res = await fetch(`/api/notices/${deletingId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Delete failed");
      toast.success("Notice deleted");
      fetchNotices();
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="flex justify-between items-center">
        <Input
          placeholder="Search title..."
          value={query}
          onChange={(e) => {
            setPage(1);
            setQuery(e.target.value);
          }}
          className="max-w-sm"
        />
      </div>

      {/* Table */}
      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Org Unit</TableHead>
              <TableHead>Created By</TableHead>
              <TableHead>Created At</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Active</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-6">
                  <Loader2 className="mx-auto h-6 w-6 animate-spin" />
                </TableCell>
              </TableRow>
            ) : notices.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center">
                  No notices found.
                </TableCell>
              </TableRow>
            ) : (
              notices.map((notice) => (
                <TableRow key={notice.id}>
                  <TableCell>{notice.title}</TableCell>
                  <TableCell>{notice.orgUnit?.name}</TableCell>
                  <TableCell>{notice.createdBy?.fullName}</TableCell>
                  <TableCell>
                    {new Date(notice.createdAt).toLocaleString()}
                  </TableCell>
                  <TableCell>{notice.type}</TableCell>
                  <TableCell>{notice.isActive ? "Yes" : "No"}</TableCell>
                  <TableCell className="flex gap-2">
                    {/* View Button */}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setViewingNotice(notice)}
                    >
                      <Eye size={16} />
                    </Button>

                    {/* Edit Button */}
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setEditingNotice(notice)}
                    >
                      <Pencil size={16} />
                    </Button>

                    {/* Delete Button */}
                    <Button
                      variant="destructive"
                      size="icon"
                      onClick={() => setDeletingId(notice.id)}
                    >
                      <Trash2 size={16} />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex justify-end gap-2">
        <Button
          onClick={() => setPage((p) => Math.max(p - 1, 1))}
          disabled={page === 1}
        >
          Prev
        </Button>
        <span className="px-2 text-sm text-muted-foreground">
          Page {page} of {totalPages}
        </span>
        <Button
          onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
          disabled={page === totalPages}
        >
          Next
        </Button>
      </div>

      {/* Edit Modal */}
      <Dialog
        open={!!editingNotice}
        onOpenChange={() => setEditingNotice(null)}
      >
        <DialogContent className="max-w-xl">
          <DialogTitle>Edit Notice</DialogTitle>
          {editingNotice && (
            <EditNoticeForm
              notice={editingNotice}
              onSuccess={() => {
                setEditingNotice(null);
                fetchNotices();
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={!!deletingId} onOpenChange={() => setDeletingId(null)}>
        <DialogContent>
          <DialogTitle>Confirm Delete</DialogTitle>
          <p className="text-muted-foreground">
            Are you sure you want to delete this notice?
          </p>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setDeletingId(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Modal */}
      {viewingNotice && (
        <ViewNoticeModal
          notice={viewingNotice}
          open={!!viewingNotice}
          onOpenChange={(open) => {
            if (!open) setViewingNotice(null);
          }}
        />
      )}
    </div>
  );
}
