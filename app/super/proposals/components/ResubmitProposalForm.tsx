"use client";

import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface Props {
  submitProposalId: number;
  initialTitle: string;
  initialDescription: string;
  initialParticipants: string[];
  initialFileUrl: string | null;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function ResubmitProposalForm({
  submitProposalId,
  initialTitle,
  initialDescription,
  initialParticipants,
  initialFileUrl,
  onSuccess,
  onCancel,
}: Props) {
  const [title, setTitle] = useState(initialTitle);
  const [description, setDescription] = useState(initialDescription);
  const [participants, setParticipants] =
    useState<string[]>(initialParticipants);
  const [participantInput, setParticipantInput] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(initialFileUrl);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setTitle(initialTitle);
    setDescription(initialDescription);
    setParticipants(initialParticipants);
    setPreview(initialFileUrl);
  }, [initialTitle, initialDescription, initialParticipants, initialFileUrl]);

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
    if (!title || participants.length === 0) {
      toast.error("Please fill all required fields.");
      return;
    }

    setIsSubmitting(true);

    try {
      let fileUrl = initialFileUrl || "";

      // Upload file only if user selected a new one
      if (file) {
        const formData = new FormData();
        formData.append("file", file);
        const uploadRes = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });
        const uploadData = await uploadRes.json();
        if (!uploadRes.ok) {
          throw new Error(uploadData.error || "File upload failed.");
        }
        fileUrl = uploadData.url;
      }

      const res = await fetch(`/api/proposals/${submitProposalId}/resubmit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          participants,
          fileUrl,
        }),
      });

      if (res.ok) {
        toast.success("Proposal resubmitted successfully.");
        onSuccess();
      } else {
        const error = await res.json();
        throw new Error(error.error || "Resubmission failed.");
      }
    } catch (err: any) {
      toast.error(err.message || "An error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4 max-w-xl">
      <h2 className="text-xl font-semibold">Resubmit Proposal</h2>

      <div>
        <Label>Title</Label>
        <Input value={title} onChange={(e) => setTitle(e.target.value)} />
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
              f?.type.startsWith("image/") ? URL.createObjectURL(f) : null
            );
          }}
        />
        {preview && (
          <div className="mt-2">
            {preview.startsWith("http") ? (
              <a
                href={preview}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 underline"
              >
                View existing attachment
              </a>
            ) : (
              <img
                src={preview}
                alt="Preview"
                className="max-w-xs max-h-64 rounded border"
              />
            )}
          </div>
        )}
      </div>

      <div className="flex gap-4">
        <Button onClick={handleSubmit} disabled={isSubmitting}>
          {isSubmitting ? "Submitting..." : "Resubmit Proposal"}
        </Button>
        <Button variant="outline" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
