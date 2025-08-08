"use client";

import { useEffect, useState, useCallback } from "react";
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

import { Loader2, Eye, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

function debounce<F extends (...args: any[]) => void>(
  func: F,
  waitFor: number
) {
  let timeout: ReturnType<typeof setTimeout>;
  return (...args: Parameters<F>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), waitFor);
  };
}

export default function StatusProposals() {
  const [proposals, setProposals] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  // Modal state
  const [open, setOpen] = useState(false);
  const [selectedProposal, setSelectedProposal] = useState<any | null>(null);

  // Manage reviewers locally in modal (to allow delete)
  const [modalReviewers, setModalReviewers] = useState<any[]>([]);

  const limit = 10;

  // Fetch proposals from API
  const fetchProposals = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/proposals/assigned?page=${page}&limit=${limit}&search=${encodeURIComponent(
          search
        )}`
      );
      const data = await res.json();
      setProposals(data.proposals);
      setTotal(data.total);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  // Debounced search input
  const debouncedSetSearch = useCallback(
    debounce((val: string) => {
      setPage(1);
      setSearch(val);
    }, 500),
    []
  );

  useEffect(() => {
    fetchProposals();
  }, [fetchProposals]);

  // Open modal and initialize reviewers list
  const openModal = (proposal: any) => {
    setSelectedProposal(proposal);
    // Clone reviewers for local modal state to enable deletion
    setModalReviewers(proposal.reviewers.map((r: any) => ({ ...r })));
    setOpen(true);
  };

  // Delete reviewer handler
  const deleteReviewer = (reviewerId: number) => {
    setModalReviewers((prev) =>
      prev.filter((r) => r.reviewerId !== reviewerId)
    );
  };

  // Save changes handler to update reviewers (add/delete) - you implement API calls here
  const saveChanges = async () => {
    try {
      // Example API call:
      // await fetch('/api/proposals/reviewers/update', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ proposalId: selectedProposal.id, reviewers: modalReviewers }),
      // });
      alert("Save changes functionality to be implemented");
      setOpen(false);
      fetchProposals();
    } catch (err) {
      console.error("Error saving changes", err);
    }
  };

  // Helper for status icon + color
  function statusIcon(status: string) {
    switch (status) {
      case "PENDING":
        return (
          <span className="text-yellow-500 font-semibold">⏳ Pending</span>
        );
      case "ACCEPTED":
        return <span className="text-green-600 font-semibold">✔ Accepted</span>;
      case "REJECTED":
        return <span className="text-red-600 font-semibold">✘ Rejected</span>;
      case "NEEDS_MODIFICATION":
        return (
          <span className="text-orange-600 font-semibold">
            ⚠ Needs Modification
          </span>
        );
      default:
        return <span>{status}</span>;
    }
  }

  return (
    <div className="space-y-4">
      {/* Search input only */}
      <Input
        placeholder="Search proposals..."
        onChange={(e) => debouncedSetSearch(e.target.value)}
        className="max-w-sm"
      />

      {/* Loading spinner */}
      {loading && (
        <div className="flex justify-center py-10">
          <Loader2 className="animate-spin h-10 w-10 text-gray-500" />
        </div>
      )}

      {/* Proposals table */}
      {!loading && (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Submitted By</TableHead>
              <TableHead>Org Unit</TableHead>
              <TableHead>Reviewers</TableHead>
              <TableHead>Submitted At</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {proposals.map((p) => (
              <TableRow key={p.id}>
                <TableCell>{p.title}</TableCell>
                <TableCell>{p.submittedBy}</TableCell>
                <TableCell>{p.orgUnit}</TableCell>
                <TableCell>
                  {p.reviewers.map((r: any) => (
                    <div
                      key={r.reviewerId}
                      className="flex items-center space-x-2"
                    >
                      <span>{r.reviewerName}</span> {statusIcon(r.status)}
                    </div>
                  ))}
                </TableCell>
                <TableCell>{p.submittedAt}</TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openModal(p)}
                    aria-label="View Proposal Details"
                  >
                    <Eye className="h-5 w-5" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {/* Pagination */}
      <div className="flex justify-between mt-4">
        <Button
          disabled={page === 1}
          onClick={() => setPage((prev) => prev - 1)}
        >
          Previous
        </Button>
        <span>
          Page {page} of {Math.ceil(total / limit)}
        </span>
        <Button
          disabled={page === Math.ceil(total / limit)}
          onClick={() => setPage((prev) => prev + 1)}
        >
          Next
        </Button>
      </div>

      {/* Proposal details modal */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] p-6">
          <DialogHeader>
            <DialogTitle>Proposal Details</DialogTitle>
            <DialogClose />
          </DialogHeader>

          {selectedProposal ? (
            <ScrollArea className="max-h-[60vh] rounded border p-4 space-y-6">
              <div>
                <h2 className="text-xl font-semibold">
                  {selectedProposal.title}
                </h2>
                <p>
                  <strong>Description:</strong>{" "}
                  {selectedProposal.description || "N/A"}
                </p>
                <p>
                  <strong>Participants:</strong>{" "}
                  {(selectedProposal.participants || []).join(", ") || "N/A"}
                </p>
                <p>
                  <strong>Submitted By:</strong> {selectedProposal.submittedBy}
                </p>
                <p>
                  <strong>Org Unit:</strong> {selectedProposal.orgUnit}
                </p>
                <p>
                  <strong>Submitted At:</strong> {selectedProposal.submittedAt}
                </p>
                {selectedProposal.fileUrl && (
                  <p>
                    <strong>File:</strong>{" "}
                    <a
                      href={selectedProposal.fileUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-blue-600 underline"
                    >
                      View File
                    </a>
                  </p>
                )}
              </div>

              <hr />

              <div>
                <h3 className="text-lg font-semibold mb-4">Reviewers</h3>
                {modalReviewers.length === 0 && (
                  <p className="text-gray-500">No reviewers assigned.</p>
                )}
                {modalReviewers.map((rev) => (
                  <div
                    key={rev.reviewerId}
                    className="relative border rounded p-4 mb-3 bg-gray-50 dark:bg-gray-800"
                  >
                    <button
                      type="button"
                      aria-label={`Remove reviewer ${rev.reviewerName}`}
                      onClick={() => deleteReviewer(rev.reviewerId)}
                      className="absolute top-2 right-2 text-red-600 hover:text-red-800"
                      title="Remove Reviewer"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>

                    <p>
                      <strong>Name:</strong> {rev.reviewerName}
                    </p>
                    <p>
                      <strong>Status:</strong> {statusIcon(rev.status)}
                    </p>
                    <p>
                      <strong>Comments:</strong> {rev.comments || "No comments"}
                    </p>
                  </div>
                ))}

                {/* Add Reviewer Button */}
                <div className="mt-4">
                  <Button
                    variant="outline"
                    onClick={() => alert("Add Reviewer UI to be implemented")}
                  >
                    Add Reviewer
                  </Button>
                </div>
              </div>

              <div className="flex justify-end space-x-2 mt-6">
                <Button variant="secondary" onClick={() => setOpen(false)}>
                  Close
                </Button>
                <Button onClick={saveChanges}>Save Changes</Button>
              </div>
            </ScrollArea>
          ) : (
            <div className="flex justify-center py-10">
              <Loader2 className="animate-spin h-10 w-10 text-gray-500" />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
