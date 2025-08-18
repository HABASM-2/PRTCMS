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
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Eye, Loader2, Send, UserPlus2 } from "lucide-react";

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
  const [forwardedProposals, setForwardedProposals] = useState<number[]>([]);
  const [filter, setFilter] = useState("");
  const [selected, setSelected] = useState<Proposal | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);

  const [forwardingProposalId, setForwardingProposalId] = useState<
    number | null
  >(null);
  const [assigningProposalId, setAssigningProposalId] = useState<number | null>(
    null
  );

  const [reviewers, setReviewers] = useState<Reviewer[]>([]);
  const [selectedReviewers, setSelectedReviewers] = useState<number[]>([]);
  const [reviewerFilter, setReviewerFilter] = useState("");

  const [loadingChips, setLoadingChips] = useState<number[]>([]);
  const [loadingList, setLoadingList] = useState(false);

  const pageSize = 5;

  // Fetch proposals + forwarded status
  useEffect(() => {
    const fetchProposals = async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/proposals");
        const data: Proposal[] = await res.json();
        setProposals(data);

        // Fetch forward status for all proposals at once
        const statuses = await Promise.all(
          data.map(async (proposal) => {
            const fRes = await fetch(`/api/proposals/${proposal.id}/forward`);
            const fData: { forwarded: boolean } = await fRes.json();
            return fData.forwarded ? Number(proposal.id) : null; // ensure number
          })
        );

        setForwardedProposals(statuses.filter(Boolean) as number[]);
      } catch (err) {
        console.error("Error fetching proposals:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProposals();
  }, []);

  // Fetch all reviewers
  const fetchReviewers = async () => {
    setLoadingList(true);
    try {
      const res = await fetch("/api/users/reviewers");
      const data: Reviewer[] = await res.json();
      setReviewers(data.filter((r) => r.id !== userId));
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingList(false);
    }
  };

  // Fetch assigned reviewers for a proposal
  const fetchAssignedReviewers = async (proposalId: number) => {
    try {
      const res = await fetch(`/api/proposals/${proposalId}/assignrev`);
      const data: Reviewer[] = await res.json();
      setSelectedReviewers(data.map((r) => Number(r.id)));
    } catch (err) {
      console.error(err);
      setSelectedReviewers([]);
    }
  };

  // Assign or remove reviewer
  const toggleReviewer = async (
    proposalId: number,
    reviewerId: number,
    assign: boolean
  ) => {
    setLoadingChips((prev) => [...prev, reviewerId]);
    try {
      const res = await fetch(`/api/proposals/${proposalId}/assignrev`, {
        method: assign ? "POST" : "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reviewerIds: assign ? [reviewerId] : undefined,
          reviewerId,
          removeFromOrgUnit: !assign,
        }),
      });

      if (!res.ok) {
        const errorText = await res.text();
        console.error("Failed to update reviewer:", errorText);
        alert("Failed to update reviewer");
      } else {
        if (assigningProposalId) {
          await fetchAssignedReviewers(assigningProposalId);
        }
      }
    } catch (err) {
      console.error(err);
      alert("Error updating reviewer");
    } finally {
      setLoadingChips((prev) => prev.filter((id) => id !== reviewerId));
    }
  };

  // Forward proposal
  const handleForward = async (proposalId: number) => {
    setForwardingProposalId(proposalId);
    try {
      const res = await fetch(`/api/proposals/${proposalId}/forward`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": userId.toString(),
        },
        body: JSON.stringify({ remarks: "" }),
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Failed to forward proposal");
      } else {
        // Mark as forwarded immediately
        setForwardedProposals((prev) => [...prev, proposalId]);
      }
    } catch (err) {
      console.error(err);
      alert("Error forwarding proposal");
    } finally {
      setForwardingProposalId(null);
    }
  };

  const filtered = proposals.filter((p) =>
    p.title.toLowerCase().includes(filter.toLowerCase())
  );
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);
  const totalPages = Math.ceil(filtered.length / pageSize);

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
              {paginated.map((proposal) => {
                const isForwarded = forwardedProposals.includes(
                  Number(proposal.id)
                );

                return (
                  <TableRow key={proposal.id}>
                    <TableCell>{proposal.title}</TableCell>
                    <TableCell>{proposal.submittedBy}</TableCell>
                    <TableCell>{proposal.orgUnit}</TableCell>
                    <TableCell>{proposal.noticeType ?? "N/A"}</TableCell>
                    <TableCell>{proposal.submittedAt}</TableCell>
                    <TableCell className="text-right space-x-2">
                      {/* View Proposal */}
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <Eye className="w-4 h-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>{proposal.title}</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-2 text-sm">
                            <p>
                              <strong>Submitted By:</strong>{" "}
                              {proposal.submittedBy}
                            </p>
                            <p>
                              <strong>Org Unit:</strong> {proposal.orgUnit}
                            </p>
                            <p>
                              <strong>Participants:</strong>{" "}
                              {proposal.participants}
                            </p>
                            <p>
                              <strong>Notice Type:</strong>{" "}
                              {proposal.noticeType ?? "N/A"}
                            </p>
                            <p>
                              <strong>Submitted At:</strong>{" "}
                              {proposal.submittedAt}
                            </p>
                            {proposal.description && (
                              <p>
                                <strong>Description:</strong>{" "}
                                {proposal.description}
                              </p>
                            )}
                            {proposal.fileUrl && (
                              <p>
                                <strong>File:</strong>{" "}
                                <a
                                  className="text-blue-600 underline"
                                  href={proposal.fileUrl}
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

                      {/* Forward Proposal */}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleForward(proposal.id)}
                        disabled={
                          isForwarded || forwardingProposalId === proposal.id
                        }
                      >
                        {forwardingProposalId === proposal.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Send className="w-4 h-4" />
                        )}
                      </Button>

                      {/* Assign Reviewers */}
                      <Dialog
                        open={assigningProposalId === proposal.id}
                        onOpenChange={async (open) => {
                          if (isForwarded) return; // disable if forwarded
                          setAssigningProposalId(open ? proposal.id : null);
                          if (open) {
                            await fetchReviewers();
                            await fetchAssignedReviewers(proposal.id);
                          } else {
                            setReviewerFilter("");
                          }
                        }}
                      >
                        <DialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            disabled={isForwarded}
                          >
                            <UserPlus2 className="w-4 h-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Assign Reviewers</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-2">
                            {/* Assigned reviewers */}
                            <div className="flex flex-wrap gap-2 mb-2">
                              {selectedReviewers.map((id) => {
                                const rev = reviewers.find((r) => r.id === id);
                                if (!rev) return null;
                                return (
                                  <Badge
                                    key={id}
                                    variant="secondary"
                                    className="cursor-pointer flex items-center gap-1"
                                    onClick={() =>
                                      toggleReviewer(proposal.id, id, false)
                                    }
                                  >
                                    {loadingChips.includes(id) ? (
                                      <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                      rev.fullName
                                    )}
                                  </Badge>
                                );
                              })}
                            </div>

                            {/* Reviewer search */}
                            <Input
                              placeholder="Search reviewers..."
                              value={reviewerFilter}
                              onChange={(e) =>
                                setReviewerFilter(e.target.value)
                              }
                              className="mb-2"
                            />

                            {/* Reviewer list */}
                            <div className="max-h-60 overflow-y-auto space-y-1">
                              {loadingList ? (
                                <div className="flex justify-center py-4">
                                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                                </div>
                              ) : (
                                reviewers
                                  .filter(
                                    (rev) =>
                                      rev.fullName
                                        .toLowerCase()
                                        .includes(
                                          reviewerFilter.toLowerCase()
                                        ) ||
                                      rev.email
                                        .toLowerCase()
                                        .includes(reviewerFilter.toLowerCase())
                                  )
                                  .map((rev) => (
                                    <div
                                      key={rev.id}
                                      className="flex items-center space-x-2"
                                    >
                                      <Checkbox
                                        checked={selectedReviewers.includes(
                                          rev.id
                                        )}
                                        onCheckedChange={(checked) =>
                                          toggleReviewer(
                                            proposal.id,
                                            rev.id,
                                            !!checked
                                          )
                                        }
                                      />
                                      <span>
                                        {rev.fullName} ({rev.email})
                                      </span>
                                    </div>
                                  ))
                              )}
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>

          {/* Pagination */}
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
