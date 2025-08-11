"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { CalendarIcon, ChevronDown, ChevronRight, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";

export default function EditNoticeForm({
  notice,
  onSuccess,
}: {
  notice: any;
  onSuccess: () => void;
}) {
  const [title, setTitle] = useState(notice.title);
  const [description, setDescription] = useState(notice.description || "");
  const [date, setDate] = useState(new Date(notice.expiredAt));
  const [file, setFile] = useState<File | null>(null);
  const [fileUrl, setFileUrl] = useState<string | null>(notice.fileUrl || null);
  const [preview, setPreview] = useState<string | null>(
    notice.fileUrl?.startsWith("http") ? notice.fileUrl : null
  );
  const [fileDeleted, setFileDeleted] = useState(false);

  const [orgUnitTree, setOrgUnitTree] = useState<any[]>([]);
  const [assignedOrgUnitIds, setAssignedOrgUnitIds] = useState<number[]>([]);
  const [selectedOrgUnitId, setSelectedOrgUnitId] = useState<number>(
    notice.orgUnitId
  );
  const [expandedNodes, setExpandedNodes] = useState<Set<number>>(new Set());
  const [type, setType] = useState(notice.type || "JUST_NOTICE");
  const [isActive, setIsActive] = useState(notice.isActive ?? true);

  useEffect(() => {
    const fetchOrgUnits = async () => {
      const res = await fetch(
        `/api/orgunits/org-units/user-orgunit-tree?id=${notice.createdById}`
      );
      const data = await res.json();
      setAssignedOrgUnitIds(data.assignedOrgUnitIds);
      setOrgUnitTree(data.tree);
    };
    fetchOrgUnits();
  }, [notice.createdById]);

  const toggleNode = (id: number) => {
    setExpandedNodes((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const OrgUnitRadioTree = ({ units }: { units: any[] }) => {
    return (
      <ul className="pl-4 space-y-1">
        {units.map((unit) => {
          const hasChildren = !!unit.children?.length;
          const isExpanded = expandedNodes.has(unit.id);
          const isDisabled = !assignedOrgUnitIds.includes(unit.id);

          return (
            <li key={unit.id}>
              <div className="flex items-center gap-2">
                {hasChildren ? (
                  <button type="button" onClick={() => toggleNode(unit.id)}>
                    {isExpanded ? <ChevronDown /> : <ChevronRight />}
                  </button>
                ) : (
                  <div className="w-4 h-4" />
                )}
                <Checkbox
                  checked={selectedOrgUnitId === unit.id}
                  onCheckedChange={() => {
                    if (!isDisabled) setSelectedOrgUnitId(unit.id);
                  }}
                  disabled={isDisabled}
                />
                <span
                  className={cn("text-sm", {
                    "text-muted-foreground": isDisabled,
                  })}
                >
                  {unit.name}
                </span>
              </div>
              {hasChildren && isExpanded && (
                <OrgUnitRadioTree units={unit.children} />
              )}
            </li>
          );
        })}
      </ul>
    );
  };

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleUpdate = async () => {
    if (!title || !date || !selectedOrgUnitId) {
      toast.error("Please fill all required fields.");
      return;
    }

    if (!assignedOrgUnitIds.includes(selectedOrgUnitId)) {
      toast.error("You can only assign notices to your own org units.");
      return;
    }

    setIsSubmitting(true);
    try {
      let updatedFileUrl = fileUrl;

      if (fileDeleted) {
        updatedFileUrl = null;
      }

      if (file) {
        const form = new FormData();
        form.append("file", file);
        const r = await fetch("/api/upload", { method: "POST", body: form });
        const d = await r.json();
        if (!r.ok) throw new Error("File upload failed.");
        updatedFileUrl = d.url;
      }

      const res = await fetch(`/api/notices/${notice.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          orgUnitId: selectedOrgUnitId,
          expiredAt: date.toISOString(),
          fileUrl: updatedFileUrl,
          type, // <--- send type
          isActive, // <--- send isActive
        }),
      });

      if (res.ok) {
        toast.success("Notice updated.");
        onSuccess();
      } else {
        const error = await res.json();
        throw new Error(error.error || "Failed to update.");
      }
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <Switch
          checked={isActive}
          onCheckedChange={setIsActive}
          id="notice-active"
        />
        <Label htmlFor="notice-active">Active</Label>
      </div>
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
        <Label>Org Unit</Label>
        {orgUnitTree.length === 0 ? (
          <p className="text-sm text-muted-foreground">Loading org units...</p>
        ) : (
          <OrgUnitRadioTree units={orgUnitTree} />
        )}
      </div>
      <div>
        <Label>Type</Label>
        <Select value={type} onValueChange={setType}>
          <SelectTrigger>
            <SelectValue placeholder="Select type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="JUST_NOTICE">Just Notice</SelectItem>
            <SelectItem value="CONCEPT_NOTE">Concept Note</SelectItem>
            <SelectItem value="PROPOSAL">Proposal</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* File Section */}
      <div>
        <Label>Attachment</Label>
        {fileUrl && !fileDeleted ? (
          <div className="flex items-center gap-4 mt-2">
            <a
              href={fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 underline text-sm"
            >
              View/Download Current File
            </a>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => {
                setFileUrl(null);
                setFileDeleted(true);
                setFile(null);
                setPreview(null);
              }}
            >
              Remove File
            </Button>
          </div>
        ) : (
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
        )}

        {preview && (
          <div className="mt-2">
            <img
              src={preview}
              alt="Preview"
              className="max-w-xs max-h-64 border rounded"
            />
          </div>
        )}
      </div>

      <div>
        <Label>Expires At</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-full justify-start text-left",
                !date && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {date ? format(date, "PPP") : "Pick a date"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar
              mode="single"
              selected={date}
              onSelect={setDate}
              initialFocus
              required
            />
          </PopoverContent>
        </Popover>
      </div>

      <Button onClick={handleUpdate} disabled={isSubmitting}>
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Updating...
          </>
        ) : (
          "Update Notice"
        )}
      </Button>
    </div>
  );
}
