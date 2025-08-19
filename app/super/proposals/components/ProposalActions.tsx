"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";

export default function ProposalActions({
  proposal,
  latestVersion,
  refreshProposal,
}: {
  proposal: any;
  latestVersion: any;
  refreshProposal: (proposalId: number) => Promise<void>;
}) {
  const [settingDecision, setSettingDecision] = useState(false);
  const [reasonDialogOpen, setReasonDialogOpen] = useState(false);
  const [decisionToSet, setDecisionToSet] = useState<
    "ACCEPTED" | "REJECTED" | null
  >(null);
  const [decisionReason, setDecisionReason] = useState("");
  const [changeTypeDialogOpen, setChangeTypeDialogOpen] = useState(false);
  const [changeTypeReason, setChangeTypeReason] = useState("");
  const [changingType, setChangingType] = useState(false);

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

  async function confirmDecision() {
    if (!proposal || !decisionToSet || !decisionReason.trim())
      return alert("Please enter a reason");

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

  async function handleChangeToProposal() {
    setChangeTypeReason("");
    setChangeTypeDialogOpen(true);
  }

  async function confirmChangeType() {
    if (!proposal || !changeTypeReason.trim())
      return alert("Enter a reason/comment for change");

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

      if (!res.ok) throw new Error("Failed to change type");
      alert("Proposal type changed to PROPOSAL");
      setChangeTypeDialogOpen(false);
      await refreshProposal(proposal.id);
    } catch (err) {
      alert("Error changing type");
      console.error(err);
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
      await refreshProposal(proposal.id);
    } catch (error) {
      alert("Error updating resubmitAllowed");
      console.error(error);
    }
  }

  const hasFinalDecision = proposal?.finalDecision?.status;

  return (
    <div>
      {/* Reviewer Display */}
      {latestVersion?.reviews && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Reviewers (Latest Version)</h3>
          <div>
            <strong>Current Reviewers:</strong>
            <div className="flex flex-wrap gap-2 mt-2">
              {(latestVersion?.reviews || []).map((rev: any) => (
                <div
                  key={rev.reviewerId}
                  className="flex items-center gap-2 border rounded px-3 py-1 bg-muted"
                >
                  <span>{rev.reviewerName}</span>
                  {/* Non-removable */}
                </div>
              ))}
            </div>

            {/* Allow submission checkbox */}
            <div className="mt-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={latestVersion?.resubmitAllowed || false}
                  onChange={(e) =>
                    toggleResubmitAllowed(latestVersion.id, e.target.checked)
                  }
                />
                Allow resubmission
              </label>
            </div>
          </div>

          {/* Final decision + change type */}
          {!hasFinalDecision && (
            <div className="pt-4 border-t flex gap-2">
              {latestVersion?.versionType === "CONCEPT_NOTE" ? (
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

              {/* Reason dialog */}
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
                    <Button onClick={confirmChangeType} disabled={changingType}>
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
          )}
        </div>
      )}

      {/* Display final decision if exists */}
      {proposal?.finalDecision && (
        <div className="p-4 bg-green-100 rounded border border-green-300 text-green-700 mt-4">
          <strong>Final Decision:</strong>{" "}
          {statusIcon(proposal.finalDecision.status)} <br />
          <strong>Reason:</strong> {proposal.finalDecision.reason || "N/A"}
        </div>
      )}
    </div>
  );
}
