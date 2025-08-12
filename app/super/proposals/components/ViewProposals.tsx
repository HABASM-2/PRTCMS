"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Eye, Loader2, UserPlus2, X } from "lucide-react";

interface Proposal {
  id: number;
  title: string;
  submittedBy: string;
  orgUnit: string;
  participants: string;
  submittedAt: string;
  description?: string;
  fileUrl?: string;
  noticeType?: string | null;
}

interface Reviewer {
  id: number;
  fullName: string;
  email: string;
}

export default function ViewProposals({ userId }: { userId: number }) {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [filter, setFilter] = useState("");
  const [selected, setSelected] = useState<Proposal | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [assigningProposalId, setAssigningProposalId] = useState<number | null>(
    null
  );
  const [reviewers, setReviewers] = useState<Reviewer[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [reviewerSearch, setReviewerSearch] = useState("");
  const [selectedReviewers, setSelectedReviewers] = useState<
    Record<number, Reviewer[]>
  >({});

  const pageSize = 5;

  useEffect(() => {
    setLoading(true);
    fetch("/api/proposals")
      .then((res) => res.json())
      .then((data) => setProposals(data))
      .catch((err) => console.error("Failed to load proposals", err))
      .finally(() => setLoading(false));
  }, []);

  const loadReviewers = async () => {
    setLoadingUsers(true);
    try {
      const res = await fetch("/api/users/reviewers");
      const data = await res.json();
      setReviewers(data);
    } catch (error) {
      console.error("Failed to load reviewers", error);
    } finally {
      setLoadingUsers(false);
    }
  };

  const assignReviewers = async (proposalId: number) => {
    const selected = selectedReviewers[proposalId] || [];
    const reviewerIds = selected.map((r) => r.id);

    try {
      const res = await fetch(`/api/proposals/${proposalId}/assignrev`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reviewerIds }),
      });

      if (!res.ok) {
        const errorText = await res.text();
        console.error("Assign reviewers failed:", res.status, errorText);
        throw new Error("Failed to assign reviewers");
      }

      alert("Reviewers assigned successfully");
      setAssigningProposalId(null);
      setSelectedReviewers((prev) => ({ ...prev, [proposalId]: [] }));
    } catch (err) {
      console.error(err);
      alert("Error assigning reviewers");
    }
  };

  const toggleReviewer = (proposalId: number, reviewer: Reviewer) => {
    setSelectedReviewers((prev) => {
      const current = prev[proposalId] || [];
      const exists = current.find((r) => r.id === reviewer.id);
      return {
        ...prev,
        [proposalId]: exists
          ? current.filter((r) => r.id !== reviewer.id)
          : [...current, reviewer],
      };
    });
  };

  const filtered = proposals.filter((p) =>
    p.title.toLowerCase().includes(filter.toLowerCase())
  );
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);
  const totalPages = Math.ceil(filtered.length / pageSize);

  const filteredReviewers = reviewers.filter((r) =>
    r.fullName.toLowerCase().includes(reviewerSearch.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <Input
        placeholder="Filter by title"
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        className="w-64"
      />

      {loading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Submitted By</TableHead>
                <TableHead>Org Unit</TableHead>
                <TableHead>Notice Type</TableHead>
                <TableHead>Submitted At</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginated.map((proposal) => (
                <TableRow key={proposal.id}>
                  <TableCell>{proposal.title}</TableCell>
                  <TableCell>{proposal.submittedBy}</TableCell>
                  <TableCell>{proposal.orgUnit}</TableCell>
                  <TableCell>{proposal.noticeType ?? "N/A"}</TableCell>
                  <TableCell>{proposal.submittedAt}</TableCell>
                  <TableCell className="text-right space-x-2">
                    {/* View Dialog */}
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setSelected(proposal)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>{selected?.title}</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-2 text-sm">
                          <p>
                            <strong>Submitted By:</strong>{" "}
                            {selected?.submittedBy}
                          </p>
                          <p>
                            <strong>Org Unit:</strong> {selected?.orgUnit}
                          </p>
                          <p>
                            <strong>Participants:</strong>{" "}
                            {selected?.participants}
                          </p>
                          <p>
                            <strong>Notice Type:</strong>{" "}
                            {selected?.noticeType ?? "N/A"}
                          </p>
                          <p>
                            <strong>Submitted At:</strong>{" "}
                            {selected?.submittedAt}
                          </p>
                          {selected?.description && (
                            <p>
                              <strong>Description:</strong>{" "}
                              {selected.description}
                            </p>
                          )}
                          {selected?.fileUrl && (
                            <p>
                              <strong>File:</strong>{" "}
                              <a
                                className="text-blue-600 underline"
                                href={selected.fileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                View Attachment
                              </a>
                            </p>
                          )}
                        </div>
                      </DialogContent>
                    </Dialog>

                    {/* Assign Reviewers Dialog */}
                    <Dialog
                      open={assigningProposalId === proposal.id}
                      onOpenChange={(open) => {
                        setAssigningProposalId(open ? proposal.id : null);
                        if (open) {
                          setReviewerSearch("");
                          loadReviewers();
                        }
                      }}
                    >
                      <DialogTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <UserPlus2 className="w-4 h-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Assign Reviewers</DialogTitle>
                        </DialogHeader>

                        <div className="space-y-3">
                          <Input
                            placeholder="Search reviewer"
                            value={reviewerSearch}
                            onChange={(e) => setReviewerSearch(e.target.value)}
                          />

                          {/* Selected Reviewers as Chips */}
                          <div className="flex flex-wrap gap-2">
                            {(selectedReviewers[proposal.id] || []).map((r) => (
                              <div
                                key={r.id}
                                className="flex items-center bg-muted px-2 py-1 rounded-full text-sm"
                              >
                                {r.fullName}
                                <button
                                  onClick={() => toggleReviewer(proposal.id, r)}
                                  className="ml-1 text-muted-foreground hover:text-foreground"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                            ))}
                          </div>

                          {loadingUsers ? (
                            <div className="text-sm text-muted-foreground">
                              Loading reviewers...
                            </div>
                          ) : (
                            <div className="max-h-60 overflow-y-auto border rounded-md divide-y">
                              {filteredReviewers.map((user) => (
                                <div
                                  key={user.id}
                                  className="p-2 hover:bg-accent cursor-pointer"
                                  onClick={() =>
                                    toggleReviewer(proposal.id, user)
                                  }
                                >
                                  <div className="font-medium">
                                    {user.fullName}
                                  </div>
                                  <div className="text-sm text-muted-foreground">
                                    {user.email}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}

                          <Button
                            className="mt-3"
                            disabled={
                              (selectedReviewers[proposal.id] || []).length ===
                              0
                            }
                            onClick={() => assignReviewers(proposal.id)}
                          >
                            Assign Reviewer(s)
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <div className="flex items-center justify-between pt-2">
            <span className="text-sm text-muted-foreground">
              Page {page} of {totalPages}
            </span>
            <div className="space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(p - 1, 1))}
                disabled={page === 1}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                disabled={page === totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
