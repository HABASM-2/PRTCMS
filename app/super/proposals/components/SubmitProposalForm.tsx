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
  description: string;
  expiredAt: string;
  fileUrl?: string | null;
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
  const [selectedNotice, setSelectedNotice] = useState<Notice | null>(null);
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
    if (!title || !selectedNotice?.id || participants.length === 0) {
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
          noticeId: selectedNotice.id,
          orgUnitId: selectedNotice.orgUnitId,
        }),
      });

      if (res.ok) {
        toast.success("Proposal submitted successfully.");
        setTitle("");
        setDescription("");
        setParticipants([]);
        setFile(null);
        setPreview(null);
        setSelectedNotice(null);
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

  // Determine file type for preview
  const renderFilePreview = (url: string) => {
    if (!url) return null;

    const lowerUrl = url.toLowerCase();

    // Image preview
    if (/\.(jpg|jpeg|png|gif|bmp|webp|svg)$/.test(lowerUrl)) {
      return (
        <img
          src={url}
          alt="Attached file preview"
          className="max-w-full max-h-64 rounded border"
        />
      );
    }

    // PDF preview
    if (lowerUrl.endsWith(".pdf")) {
      return (
        <iframe
          src={url}
          className="w-full h-64 rounded border"
          title="PDF Preview"
        />
      );
    }

    // For .doc/.docx or other unknown file types, show download link only
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="text-blue-600 underline"
      >
        Download attached file
      </a>
    );
  };

  return (
    <div className="flex flex-col md:flex-row gap-6">
      {/* LEFT: Form */}
      <div className="flex-1 max-w-xl space-y-4">
        <h2 className="text-xl font-semibold">Submit Proposal</h2>

        {isLoadingNotices ? (
          <div className="p-4 text-muted-foreground">Loading notices...</div>
        ) : availableNotices.length > 0 ? (
          <>
            <div>
              <Label>Select Notice</Label>
              <Select
                value={selectedNotice?.id.toString() || ""}
                onValueChange={(value) => {
                  const notice =
                    availableNotices.find((n) => n.id === Number(value)) ||
                    null;
                  setSelectedNotice(notice);
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

            {selectedNotice && (
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
                      <li
                        key={idx}
                        className="flex justify-between items-center"
                      >
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

      {/* RIGHT: Notice Preview */}
      <div className="w-full md:w-[700px] border-t md:border-t-0 md:border-l pt-4 md:pt-0 md:pl-4 sticky top-4 self-start">
        <h3 className="text-lg font-semibold mb-2">Notice Preview</h3>
        {selectedNotice ? (
          <div className="space-y-2 text-sm">
            <p>
              <strong>Title:</strong> {selectedNotice.title}
            </p>
            <p>
              <strong>Organisation:</strong> {selectedNotice.orgName}
            </p>
            <p>
              <strong>Org Unit:</strong> {selectedNotice.orgUnitName}
            </p>
            <p>
              <strong>Description:</strong> {selectedNotice.description || "—"}
            </p>
            <p>
              <strong>Expires:</strong>{" "}
              {new Date(selectedNotice.expiredAt).toLocaleDateString()}
            </p>
            {selectedNotice.fileUrl && (
              <div className="mt-2">
                {renderFilePreview(selectedNotice.fileUrl)}
              </div>
            )}
          </div>
        ) : (
          <p className="text-muted-foreground">
            Select a notice to see details.
          </p>
        )}
      </div>
    </div>
  );
}
