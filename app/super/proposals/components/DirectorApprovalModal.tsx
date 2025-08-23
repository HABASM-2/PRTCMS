"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  proposalId: number | null;
  approvals: any[];
  refresh: () => void;
}

export default function DirectorApprovalModal({
  open,
  onOpenChange,
  proposalId,
  approvals,
  refresh,
}: Props) {
  const [status, setStatus] = useState<
    "PENDING" | "ACCEPTED" | "REJECTED" | "NEEDS_MODIFICATION"
  >("ACCEPTED");
  const [reason, setReason] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [totalBudget, setTotalBudget] = useState<number>(0); // <-- new
  const [loading, setLoading] = useState(false); // For submit
  const [initialLoading, setInitialLoading] = useState(false); // For fetching previous info

  // Fetch existing info if any when modal opens
  useEffect(() => {
    if (!open || !proposalId) return;

    const fetchApprovalData = async () => {
      setInitialLoading(true);
      try {
        const res = await fetch(
          `/api/proposals/${proposalId}/director-approvals`
        );
        if (!res.ok) throw new Error("Failed to fetch approvals");
        const data = await res.json();

        if (data && data.length > 0) {
          const latest = data[data.length - 1];
          setStatus(latest.status);
          setReason(latest.reason || "");
          setTotalBudget(latest.totalBudget || 0); // <-- set budget
        } else {
          setStatus("ACCEPTED");
          setReason("");
          setTotalBudget(0);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setInitialLoading(false);
      }
    };

    fetchApprovalData();
  }, [open, proposalId]);

  const handleSubmit = async () => {
    if (!proposalId) return;
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("status", status);
      formData.append("reason", reason);
      formData.append("totalBudget", totalBudget.toString()); // <-- append budget
      if (file) formData.append("file", file);

      const res = await fetch(
        `/api/proposals/${proposalId}/director-approvals`,
        {
          method: "POST",
          body: formData,
        }
      );

      if (!res.ok) throw new Error("Failed to submit approval");

      onOpenChange(false);
      refresh();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Disable if loading or if approvals already exist
  const isDisabled =
    loading || initialLoading || (approvals && approvals.length > 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg sm:max-w-xl relative fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
        {initialLoading && (
          <div className="absolute inset-0 bg-white/70 dark:bg-black/50 flex items-center justify-center z-50">
            <Loader2 className="animate-spin h-10 w-10 text-gray-500 dark:text-gray-400" />
          </div>
        )}
        <DialogHeader>
          <DialogTitle>Director Approval</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          {/* Status */}
          <div>
            <Label htmlFor="status">Status</Label>
            <Select
              disabled={isDisabled}
              value={status}
              onValueChange={(val) => setStatus(val as any)}
            >
              <SelectTrigger id="status" className="mt-1 w-full">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="ACCEPTED">Accepted</SelectItem>
                <SelectItem value="REJECTED">Rejected</SelectItem>
                <SelectItem value="NEEDS_MODIFICATION">
                  Needs Modification
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Reason */}
          <div>
            <Label htmlFor="reason">Reason</Label>
            <Input
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              disabled={isDisabled}
            />
          </div>

          {/* Budget */}
          <div>
            <Label htmlFor="budget">Total Budget</Label>
            <Input
              id="budget"
              type="number"
              value={totalBudget}
              min={0}
              step={0.01}
              onChange={(e) => setTotalBudget(parseFloat(e.target.value))}
              disabled={isDisabled}
            />
          </div>

          {/* File Upload */}
          <div>
            <Label htmlFor="file">Upload File</Label>
            <Input
              id="file"
              type="file"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              disabled={isDisabled}
            />
          </div>

          {/* Previous Approvals */}
          {approvals && approvals.length > 0 && (
            <div>
              <h3 className="font-semibold mt-2">Previous Approvals</h3>
              <ul className="list-disc pl-5">
                {approvals.map((a) => (
                  <li key={a.id}>
                    {a.director.name}: {a.status}{" "}
                    {a.totalBudget ? `- Budget: ${a.totalBudget}` : ""}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <DialogFooter className="mt-4 flex justify-end gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isDisabled}
          >
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isDisabled}>
            {loading ? (
              <Loader2 className="animate-spin h-4 w-4 mr-2 inline" />
            ) : null}
            Submit
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
