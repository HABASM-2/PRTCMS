"use client";

import { useState, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";

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

export default function ProposalDetailsModal({
  open,
  onOpenChange,
  proposal,
  refreshProposal,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  proposal: any | null;
  refreshProposal: (proposalId: number) => Promise<void>;
}) {
  const [loadingModal, setLoadingModal] = useState(false);
  const [allReviewers, setAllReviewers] = useState<any[]>([]);
  const [selectedReviewersToAdd, setSelectedReviewersToAdd] = useState<any[]>(
    []
  );
  const [assigningReviewers, setAssigningReviewers] = useState(false);
  const [removingReviewerId, setRemovingReviewerId] = useState<number | null>(
    null
  );
  const [settingDecision, setSettingDecision] = useState(false);
  const [reviewerSearch, setReviewerSearch] = useState("");
  const [reasonDialogOpen, setReasonDialogOpen] = useState(false);
  const [decisionToSet, setDecisionToSet] = useState<
    "ACCEPTED" | "REJECTED" | null
  >(null);
  const [decisionReason, setDecisionReason] = useState("");

  const [changeTypeDialogOpen, setChangeTypeDialogOpen] = useState(false);
  const [changeTypeReason, setChangeTypeReason] = useState("");
  const [changingType, setChangingType] = useState(false);

  const latestVersionval = proposal?.versions?.[proposal.versions.length - 1];
  // console.log("Here is the latest version values man", latestVersionval);

  const debouncedSetReviewerSearch = useCallback(
    debounce((val: string) => {
      setReviewerSearch(val);
    }, 300),
    []
  );

  const filteredReviewers = allReviewers.filter((r) =>
    (r.fullName + " " + r.email)
      .toLowerCase()
      .includes(reviewerSearch.toLowerCase())
  );

  const loadAllReviewers = async () => {
    try {
      const res = await fetch("/api/users/reviewers");
      const data = await res.json();
      setAllReviewers(data);
    } catch (err) {
      console.error("Error loading reviewers", err);
      setAllReviewers([]);
    }
  };

  const openModal = async () => {
    if (!proposal) return;
    setLoadingModal(true);
    try {
      await loadAllReviewers();
      setSelectedReviewersToAdd([]);
    } catch (err) {
      console.error("Error loading modal data", err);
    } finally {
      setLoadingModal(false);
    }
  };

  function toggleReviewerToAdd(r: any) {
    setSelectedReviewersToAdd((prev) => {
      if (prev.find((x) => x.id === r.id)) {
        return prev.filter((x) => x.id !== r.id);
      }
      return [...prev, r];
    });
  }
  function handleChangeToProposal() {
    setChangeTypeReason("");
    setChangeTypeDialogOpen(true);
  }

  async function confirmChangeType() {
    if (!proposal) return;
    if (!changeTypeReason.trim()) {
      alert("Please enter a reason/comment for the change");
      return;
    }

    setChangingType(true);
    try {
      const res = await fetch(`/api/proposals/${proposal.id}/change-type`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          newType: "PROPOSAL",
          comment: changeTypeReason.trim(),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to change type");
      }

      alert("Proposal type changed to PROPOSAL");
      setChangeTypeDialogOpen(false);
      await refreshProposal(proposal.id);
    } catch (err) {
      alert(`Error: ${err}`);
    } finally {
      setChangingType(false);
    }
  }

  async function toggleResubmitAllowed(versionId: number, newValue: boolean) {
    try {
      const res = await fetch(
        `/api/proposals/proposalVersions/${versionId}/resubmitAllowed`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ resubmitAllowed: newValue }),
        }
      );

      if (!res.ok) throw new Error("Failed to update resubmitAllowed");

      // refresh proposal data or update state
    } catch (error) {
      alert("Error updating resubmitAllowed");
    }
  }

  async function assignReviewers() {
    if (!proposal) return;
    setAssigningReviewers(true);
    try {
      const latestVersion = proposal.versions[proposal.versions.length - 1];
      if (!latestVersion) return;

      const reviewerIds = selectedReviewersToAdd.map((r) => r.id);
      if (reviewerIds.length === 0) {
        alert("Select reviewers to add");
        setAssigningReviewers(false);
        return;
      }

      const res = await fetch(`/api/proposals/${proposal.id}/assignrev`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reviewerIds }),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Failed to assign reviewers");
      }

      alert("Reviewers assigned");
      setSelectedReviewersToAdd([]);
      await refreshProposal(proposal.id);
    } catch (err) {
      alert("Error assigning reviewers");
      console.error(err);
    } finally {
      setAssigningReviewers(false);
    }
  }

  async function removeReviewer(reviewerId: number) {
    if (!proposal) return;
    if (!confirm("Remove this reviewer?")) return;

    setRemovingReviewerId(reviewerId);
    try {
      const res = await fetch(
        `/api/proposals/${proposal.id}/removerev/${reviewerId}`,
        {
          method: "DELETE",
        }
      );

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Failed to remove reviewer");
      }

      alert("Reviewer removed");
      await refreshProposal(proposal.id);
    } catch (err) {
      alert("Error removing reviewer");
      console.error(err);
    } finally {
      setRemovingReviewerId(null);
    }
  }

  async function confirmDecision() {
    if (!proposal || !decisionToSet) return;
    if (!decisionReason.trim()) {
      alert("Please enter a reason");
      return;
    }
    setSettingDecision(true);

    try {
      const res = await fetch(`/api/proposals/${proposal.id}/finalDecision`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          decision: decisionToSet,
          reason: decisionReason,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "Failed to set decision");
      } else {
        alert(`Proposal marked as ${decisionToSet.toLowerCase()}`);
        onOpenChange(false);
        await refreshProposal(proposal.id);
      }
    } catch (err) {
      alert("Error setting final decision");
      console.error(err);
    } finally {
      setSettingDecision(false);
      setReasonDialogOpen(false);
      setDecisionReason("");
      setDecisionToSet(null);
    }
  }

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

  // Fix here: define a boolean to check if a final decision with a status exists
  const hasFinalDecision =
    proposal?.finalDecision && !!proposal.finalDecision.status;
  useEffect(() => {
    if (open) {
      openModal();
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] p-6">
        <DialogHeader>
          <DialogTitle>Proposal Details</DialogTitle>
          <DialogClose />
        </DialogHeader>

        {loadingModal ? (
          <div className="flex justify-center py-10">
            <Loader2 className="animate-spin h-10 w-10 text-gray-500" />
          </div>
        ) : proposal ? (
          <ScrollArea className="max-h-[65vh] pr-4">
            <div className="mb-4">
              <h2 className="text-xl font-semibold">{proposal.title}</h2>
              <p>
                <strong>Description:</strong> {proposal.description || "N/A"}
              </p>
              <p>
                <strong>Participants:</strong>{" "}
                {(proposal.participants || []).join(", ") || "N/A"}
              </p>
              <p>
                <strong>Submitted By:</strong> {proposal.submittedBy}
              </p>
              <p>
                <strong>Org Unit:</strong> {proposal.orgUnit}
              </p>
              <p>
                <strong>Submitted At:</strong>{" "}
                {new Date(proposal.submittedAt).toLocaleString()}
              </p>
              {proposal.fileUrl && (
                <p>
                  <strong>File:</strong>{" "}
                  <a
                    href={proposal.fileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-600 underline"
                  >
                    View File
                  </a>
                </p>
              )}
            </div>

            <hr className="my-4" />

            {/* Versions Accordion */}
            <Accordion type="single" collapsible>
              {proposal.versions.map((version: any) => (
                <AccordionItem
                  key={version.versionNumber}
                  value={`v${version.versionNumber}`}
                >
                  <AccordionTrigger>
                    Version {version.versionNumber} —{" "}
                    {new Date(version.createdAt).toLocaleDateString()}
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-2">
                      <p>
                        <strong>Title:</strong> {version.title}
                      </p>
                      <p>
                        <strong>Description:</strong>{" "}
                        {version.description || "N/A"}
                      </p>
                      <p>
                        <strong>Participants:</strong>{" "}
                        {(version.participants || []).join(", ") || "N/A"}
                      </p>
                      {version.fileUrl && (
                        <p>
                          <strong>File:</strong>{" "}
                          <a
                            href={version.fileUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-blue-600 underline"
                          >
                            View File
                          </a>
                        </p>
                      )}

                      <div className="mt-3">
                        <h4 className="font-semibold">Reviewers</h4>
                        {version.reviews.length === 0 && (
                          <p className="text-gray-500">No reviewers assigned</p>
                        )}
                        {version.reviews.map((rev: any) => (
                          <div key={rev.reviewerId} className="ml-4 mt-1">
                            <strong>{rev.reviewerName}</strong> —{" "}
                            {statusIcon(rev.status)}
                            {rev.commentsDetails.length === 0 ? (
                              <div className="text-sm text-gray-600">
                                No comments
                              </div>
                            ) : (
                              rev.commentsDetails.map((comment: any) => (
                                <div
                                  key={comment.id}
                                  className="text-sm text-gray-700 mb-1 border-l-2 pl-2"
                                >
                                  <strong>{comment.authorName}:</strong>{" "}
                                  {comment.content}
                                  <div className="text-xs text-gray-400">
                                    {new Date(
                                      comment.createdAt
                                    ).toLocaleString()}
                                  </div>
                                </div>
                              ))
                            )}
                          </div>
                        ))}
                      </div>
                      <div className="mt-4 flex items-center gap-2">
                        <Checkbox
                          id={`resubmit-allowed-${version.id}`}
                          defaultChecked={version.resubmitAllowed} // initial checked state only
                          onCheckedChange={(checked) => {
                            toggleResubmitAllowed(version.id, Boolean(checked));
                          }}
                        />
                        <label
                          htmlFor={`resubmit-allowed-${version.id}`}
                          className="select-none"
                        >
                          Allow Resubmission of this Version
                        </label>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>

            {/* Reviewer Management + Final Decision - only if no final decision */}
            {proposal.versions.length > 0 && !hasFinalDecision && (
              <>
                <hr className="my-6" />

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">
                    Manage Reviewers (Latest Version)
                  </h3>

                  {/* Current reviewers with remove */}
                  <div>
                    <strong>Current Reviewers:</strong>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {proposal.versions[
                        proposal.versions.length - 1
                      ].reviews.map((rev: any) => (
                        <div
                          key={rev.reviewerId}
                          className="flex items-center gap-2 border rounded px-3 py-1 bg-muted"
                        >
                          <span>{rev.reviewerName}</span>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => removeReviewer(rev.reviewerId)}
                            disabled={removingReviewerId === rev.reviewerId}
                            title="Remove reviewer"
                          >
                            {removingReviewerId === rev.reviewerId ? (
                              <Loader2 className="animate-spin h-4 w-4" />
                            ) : (
                              <X className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Add reviewers */}
                  <div>
                    <strong>Add Reviewers:</strong>
                    <Input
                      placeholder="Search reviewers by name or email"
                      onChange={(e) =>
                        debouncedSetReviewerSearch(e.target.value)
                      }
                      className="mb-2"
                    />
                    <div className="max-h-40 overflow-y-auto border rounded p-2">
                      {allReviewers.length === 0 && (
                        <p className="text-gray-500">Loading reviewers...</p>
                      )}
                      {filteredReviewers.length === 0 &&
                        allReviewers.length > 0 && (
                          <p className="text-gray-500">
                            No reviewers match your search.
                          </p>
                        )}
                      {filteredReviewers.map((r) => {
                        const isSelected = selectedReviewersToAdd.some(
                          (sel) => sel.id === r.id
                        );
                        return (
                          <div
                            key={r.id}
                            onClick={() => toggleReviewerToAdd(r)}
                            className={`cursor-pointer p-1 rounded ${
                              isSelected
                                ? "bg-blue-500 text-white"
                                : "hover:bg-blue-100"
                            }`}
                          >
                            {r.fullName} ({r.email})
                          </div>
                        );
                      })}
                    </div>
                    <Button
                      className="mt-2"
                      onClick={assignReviewers}
                      disabled={
                        assigningReviewers ||
                        selectedReviewersToAdd.length === 0
                      }
                    >
                      {assigningReviewers && (
                        <Loader2 className="animate-spin h-4 w-4 mr-2" />
                      )}
                      Assign Selected Reviewers
                    </Button>
                  </div>

                  {/* Final decision */}
                  <div className="pt-4 border-t flex gap-2">
                    {latestVersionval?.versionType === "CONCEPT_NOTE" ? (
                      <>
                        <Button
                          variant="destructive"
                          onClick={() => {
                            setDecisionToSet("REJECTED");
                            setReasonDialogOpen(true);
                          }}
                          disabled={settingDecision}
                        >
                          Reject Concept Note
                        </Button>

                        <Button
                          variant="default"
                          onClick={handleChangeToProposal}
                          disabled={settingDecision}
                        >
                          Change to Proposal
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button
                          variant="destructive"
                          onClick={() => {
                            setDecisionToSet("REJECTED");
                            setReasonDialogOpen(true);
                          }}
                          disabled={settingDecision}
                        >
                          Reject Proposal
                        </Button>

                        <Button
                          variant="default"
                          onClick={() => {
                            setDecisionToSet("ACCEPTED");
                            setReasonDialogOpen(true);
                          }}
                          disabled={settingDecision}
                        >
                          Accept Proposal
                        </Button>
                      </>
                    )}
                    {/* Reason input dialog */}
                    <Dialog
                      open={reasonDialogOpen}
                      onOpenChange={setReasonDialogOpen}
                    >
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>
                            Provide reason for {decisionToSet?.toLowerCase()}
                          </DialogTitle>
                          <DialogClose />
                        </DialogHeader>
                        <Input
                          placeholder="Enter reason"
                          value={decisionReason}
                          onChange={(e) => setDecisionReason(e.target.value)}
                          className="mb-4"
                          autoFocus
                        />
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="secondary"
                            onClick={() => setReasonDialogOpen(false)}
                          >
                            Cancel
                          </Button>
                          <Button
                            onClick={confirmDecision}
                            disabled={settingDecision}
                          >
                            {settingDecision ? (
                              <Loader2 className="animate-spin h-4 w-4" />
                            ) : (
                              "Submit"
                            )}
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                    <Dialog
                      open={changeTypeDialogOpen}
                      onOpenChange={setChangeTypeDialogOpen}
                    >
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>
                            Reason for changing to Proposal
                          </DialogTitle>
                          <DialogClose />
                        </DialogHeader>
                        <Input
                          placeholder="Enter reason/comment"
                          value={changeTypeReason}
                          onChange={(e) => setChangeTypeReason(e.target.value)}
                          className="mb-4"
                          autoFocus
                        />
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="secondary"
                            onClick={() => setChangeTypeDialogOpen(false)}
                            disabled={changingType}
                          >
                            Cancel
                          </Button>
                          <Button
                            onClick={confirmChangeType}
                            disabled={changingType}
                          >
                            {changingType ? (
                              <Loader2 className="animate-spin h-4 w-4" />
                            ) : (
                              "Submit"
                            )}
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              </>
            )}
            {proposal.finalDecision && (
              <div className="p-4 bg-green-100 rounded border border-green-300 text-green-700">
                <strong>Final Decision:</strong>{" "}
                {statusIcon(proposal.finalDecision.status)} <br />
                <strong>Reason:</strong>{" "}
                {proposal.finalDecision.reason || "N/A"}
              </div>
            )}
          </ScrollArea>
        ) : (
          <p>No proposal selected</p>
        )}
      </DialogContent>
    </Dialog>
  );
}
