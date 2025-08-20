"use client";

import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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
  const [expandedVersions, setExpandedVersions] = useState<number[]>([]);
  const [settingDecision, setSettingDecision] = useState(false);
  const [decisionToSet, setDecisionToSet] = useState<
    "ACCEPTED" | "REJECTED" | null
  >(null);
  const [decisionReason, setDecisionReason] = useState("");
  const [reasonDialogOpen, setReasonDialogOpen] = useState(false);
  const [changeTypeDialogOpen, setChangeTypeDialogOpen] = useState(false);
  const [changeTypeReason, setChangeTypeReason] = useState("");
  const [changingType, setChangingType] = useState(false);

  const latestVersionval = proposal?.versions?.[proposal.versions.length - 1];
  const hasFinalDecision = proposal?.finalDecision?.status;

  const toggleVersion = (versionId: number) => {
    setExpandedVersions((prev) =>
      prev.includes(versionId)
        ? prev.filter((id) => id !== versionId)
        : [...prev, versionId]
    );
  };

  const statusIcon = (status: string) => {
    switch (status) {
      case "PENDING":
        return (
          <span className="text-yellow-500 font-semibold">⏳ Pending</span>
        );
      case "ACCEPTED":
        return <span className="text-green-500 font-semibold">✔ Accepted</span>;
      case "REJECTED":
        return <span className="text-red-500 font-semibold">✘ Rejected</span>;
      case "NEEDS_MODIFICATION":
        return (
          <span className="text-orange-500 font-semibold">
            ⚠ Needs Modification
          </span>
        );
      default:
        return <span>{status}</span>;
    }
  };

  const confirmDecision = async (proposalId: number) => {
    if (!decisionToSet || !decisionReason.trim())
      return alert("Please enter a reason");
    setSettingDecision(true);
    try {
      const res = await fetch(`/api/proposals/${proposalId}/finalDecision`, {
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
      } else await refreshProposal(proposalId);
    } catch (err) {
      console.error(err);
      alert("Error setting final decision");
    } finally {
      setSettingDecision(false);
      setReasonDialogOpen(false);
      setDecisionReason("");
      setDecisionToSet(null);
    }
  };

  const confirmChangeType = async (proposalId: number) => {
    if (!changeTypeReason.trim())
      return alert("Enter a reason/comment for change");
    setChangingType(true);
    try {
      const res = await fetch(`/api/proposals/${proposalId}/change-type`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          newType: "PROPOSAL",
          comment: changeTypeReason.trim(),
        }),
      });
      if (!res.ok) throw new Error("Failed to change type");
      setChangeTypeDialogOpen(false);
      await refreshProposal(proposalId);
    } catch (err) {
      console.error(err);
      alert("Error changing type");
    } finally {
      setChangingType(false);
    }
  };

  const toggleResubmitAllowed = async (
    versionId: number,
    newValue: boolean
  ) => {
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
      await refreshProposal(proposal!.id);
    } catch (err) {
      console.error(err);
      alert("Error updating resubmitAllowed");
    }
  };

  const openModal = async () => {
    if (!proposal) return;
    setLoadingModal(true);
    try {
      // load any other modal data if needed
    } catch (err) {
      console.error("Error loading modal data", err);
    } finally {
      setLoadingModal(false);
    }
  };

  useEffect(() => {
    if (open) openModal();
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
          <ScrollArea className="max-h-[65vh] pr-4 space-y-4">
            {/* Basic Proposal Info */}
            <div className="mb-2">
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

            <hr />

            {/* Versions Accordion (combined) */}
            <Accordion type="single" collapsible>
              {proposal.versions.map((version: any) => (
                <AccordionItem
                  key={version.id}
                  value={`v${version.versionNumber}`}
                >
                  <AccordionTrigger onClick={() => toggleVersion(version.id)}>
                    Version {version.versionNumber} —{" "}
                    {new Date(version.createdAt).toLocaleDateString()}
                  </AccordionTrigger>
                  <AccordionContent className="space-y-3">
                    {/* Version Details */}
                    <div className="space-y-1">
                      {version.title && (
                        <p className="italic font-medium">
                          Title: {version.title}
                        </p>
                      )}
                      {version.description && (
                        <p>Description: {version.description}</p>
                      )}
                      {version.participants?.length > 0 && (
                        <p>Participants: {version.participants.join(", ")}</p>
                      )}
                      {version.fileUrl && (
                        <p>
                          File:{" "}
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
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Created at:{" "}
                        {new Date(version.createdAt).toLocaleString()}
                      </p>
                    </div>

                    {/* Resubmit Checkbox */}
                    {/* <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={version.resubmitAllowed || false}
                        onChange={(e) =>
                          toggleResubmitAllowed(version.id, e.target.checked)
                        }
                        className="cursor-pointer"
                      />
                      <span className="text-sm dark:text-gray-300">
                        Allow resubmission
                      </span>
                    </label> */}

                    {/* Reviews / Comments with Status */}
                    {version.reviews?.length > 0 && (
                      <div className="mt-2 space-y-2">
                        {version.reviews.map((rev: any) => (
                          <div
                            key={rev.reviewerId}
                            className="border rounded p-2 bg-gray-50 dark:bg-gray-700"
                          >
                            <div className="flex items-center justify-between font-semibold">
                              <span>{rev.reviewerName}</span>
                              <span
                                className={`text-sm font-medium px-2 py-0.5 rounded-full ${
                                  rev.status === "ACCEPTED"
                                    ? "bg-green-200 dark:bg-green-800 text-green-800 dark:text-green-200"
                                    : rev.status === "REJECTED"
                                    ? "bg-red-200 dark:bg-red-800 text-red-800 dark:text-red-200"
                                    : rev.status === "NEEDS_MODIFICATION"
                                    ? "bg-orange-200 dark:bg-orange-800 text-orange-800 dark:text-orange-200"
                                    : "bg-yellow-200 dark:bg-yellow-800 text-yellow-800 dark:text-yellow-200"
                                }`}
                              >
                                {rev.status}
                              </span>
                            </div>
                            {rev.commentsDetails?.length > 0 ? (
                              <ul className="ml-3 mt-1 list-disc list-inside text-sm text-gray-700 dark:text-gray-300">
                                {rev.commentsDetails.map((c: any) => (
                                  <li key={c.id}>
                                    <span className="font-medium">
                                      {c.authorName}:
                                    </span>{" "}
                                    {c.content}{" "}
                                    <span className="text-gray-400 dark:text-gray-400 text-xs">
                                      ({new Date(c.createdAt).toLocaleString()})
                                    </span>
                                  </li>
                                ))}
                              </ul>
                            ) : (
                              <p className="ml-2 text-sm text-gray-500 dark:text-gray-400">
                                No comments yet
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Final Decision & Change Type Buttons (latest version only) */}
                    {latestVersionval?.id === version.id &&
                      !hasFinalDecision && (
                        <div className="pt-2 flex gap-2">
                          {version.versionType === "CONCEPT_NOTE" ? (
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
                                onClick={() => setChangeTypeDialogOpen(true)}
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
                        </div>
                      )}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>

            {/* Reason Dialog */}
            <Dialog open={reasonDialogOpen} onOpenChange={setReasonDialogOpen}>
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
                    onClick={() => confirmDecision(proposal.id)}
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

            {/* Change Type Dialog */}
            <Dialog
              open={changeTypeDialogOpen}
              onOpenChange={setChangeTypeDialogOpen}
            >
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Reason for changing to Proposal</DialogTitle>
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
                    onClick={() => confirmChangeType(proposal.id)}
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

            {/* Final decision display */}
            {proposal?.finalDecision && (
              <div className="p-4 bg-green-100 dark:bg-green-900 rounded border border-green-300 dark:border-green-700 text-green-700 dark:text-green-200 mt-4">
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
