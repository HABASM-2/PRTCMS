"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

interface Notice {
  id: number;
  title: string;
  orgUnitId: number;
  orgName: string;
  orgUnitName: string;
}

interface SubmitProposalFormProps {
  userId: number;
}

export default function SubmitProposalForm({
  userId,
}: SubmitProposalFormProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [participants, setParticipants] = useState<string[]>([]);
  const [participantInput, setParticipantInput] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const [availableNotices, setAvailableNotices] = useState<Notice[]>([]);
  const [selectedNoticeId, setSelectedNoticeId] = useState<number | null>(null);
  const [selectedOrgUnitId, setSelectedOrgUnitId] = useState<number | null>(
    null
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingNotices, setIsLoadingNotices] = useState(true);

  useEffect(() => {
    const fetchNotices = async () => {
      setIsLoadingNotices(true);
      try {
        const res = await fetch(
          `/api/notices/available-for-submission?userId=${userId}`
        );
        const data = await res.json();
        if (res.ok) {
          setAvailableNotices(data);
        } else {
          toast.error("Failed to load available notices.");
        }
      } catch (err) {
        toast.error("Something went wrong while fetching notices.");
      } finally {
        setIsLoadingNotices(false);
      }
    };
    fetchNotices();
  }, [userId]);

  const addParticipant = () => {
    const trimmed = participantInput.trim();
    if (trimmed && !participants.includes(trimmed)) {
      setParticipants((prev) => [...prev, trimmed]);
      setParticipantInput("");
    }
  };

  const removeParticipant = (p: string) => {
    setParticipants((prev) => prev.filter((item) => item !== p));
  };

  const handleSubmit = async () => {
    if (
      !title ||
      !selectedNoticeId ||
      !selectedOrgUnitId ||
      participants.length === 0
    ) {
      toast.error("Please fill all required fields.");
      return;
    }

    setIsSubmitting(true);

    try {
      let fileUrl = "";
      if (file) {
        const formData = new FormData();
        formData.append("file", file);
        const uploadRes = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });
        const uploadData = await uploadRes.json();
        if (!uploadRes.ok)
          throw new Error(uploadData.error || "File upload failed.");
        fileUrl = uploadData.url;
      }

      const res = await fetch("/api/proposals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          participants,
          fileUrl,
          noticeId: selectedNoticeId,
          orgUnitId: selectedOrgUnitId,
        }),
      });

      if (res.ok) {
        toast.success("Proposal submitted successfully.");
        setTitle("");
        setDescription("");
        setParticipants([]);
        setFile(null);
        setPreview(null);
        setSelectedNoticeId(null);
        setSelectedOrgUnitId(null);
      } else {
        const error = await res.json();
        throw new Error(error.error || "Submission failed.");
      }
    } catch (err: any) {
      toast.error(err.message || "An error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4 max-w-xl">
      <h2 className="text-xl font-semibold">Submit Proposal</h2>

      {isLoadingNotices ? (
        <div className="p-4 text-muted-foreground">Loading notices...</div>
      ) : availableNotices.length > 0 ? (
        <>
          <div>
            <Label>Select Notice</Label>
            <Select
              value={selectedNoticeId?.toString() || ""}
              onValueChange={(value) => {
                const id = parseInt(value);
                const notice = availableNotices.find((n) => n.id === id);
                setSelectedNoticeId(id);
                setSelectedOrgUnitId(notice?.orgUnitId ?? null);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Choose a notice to submit for..." />
              </SelectTrigger>
              <SelectContent>
                {availableNotices.map((notice) => (
                  <SelectItem key={notice.id} value={notice.id.toString()}>
                    {notice.title} - [{notice.orgUnitName}]
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedNoticeId && (
            <>
              <div>
                <Label>Title</Label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              <div>
                <Label>Description</Label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <div>
                <Label>Participants</Label>
                <div className="flex gap-2">
                  <Input
                    value={participantInput}
                    onChange={(e) => setParticipantInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addParticipant();
                      }
                    }}
                    placeholder="Type name and press Enter"
                  />
                  <Button type="button" onClick={addParticipant}>
                    Add
                  </Button>
                </div>
                <ul className="mt-2 list-disc pl-5 text-sm text-muted-foreground">
                  {participants.map((p, idx) => (
                    <li key={idx} className="flex justify-between items-center">
                      <span>{p}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeParticipant(p)}
                      >
                        Remove
                      </Button>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <Label>Attachment</Label>
                <Input
                  type="file"
                  accept=".pdf,.doc,.docx,image/*"
                  onChange={(e) => {
                    const f = e.target.files?.[0] || null;
                    setFile(f);
                    setPreview(
                      f?.type.startsWith("image/")
                        ? URL.createObjectURL(f)
                        : null
                    );
                  }}
                />
                {file && (
                  <div className="mt-2">
                    {preview ? (
                      <img
                        src={preview}
                        alt="Preview"
                        className="max-w-xs max-h-64 rounded border"
                      />
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        Attached: <strong>{file.name}</strong>
                      </p>
                    )}
                  </div>
                )}
              </div>

              <Button onClick={handleSubmit} disabled={isSubmitting}>
                {isSubmitting ? "Submitting..." : "Submit Proposal"}
              </Button>
            </>
          )}
        </>
      ) : (
        <div className="p-4 bg-muted rounded text-muted-foreground">
          No active notices available for submission at the moment.
        </div>
      )}
    </div>
  );
}
