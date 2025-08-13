"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { CalendarIcon, ChevronDown, ChevronRight, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import { Switch } from "@/components/ui/switch";
import OrgUnitTreeSelector from "./OrgUnitTreeSelector";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";

interface UploadNoticeProps {
  userId: string;
  roles: string[];
}

export default function UploadNotice({ userId, roles }: UploadNoticeProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState("");
  const [selectedRole, setSelectedRole] = useState("");
  const [selectedOrgUnitIds, setSelectedOrgUnitIds] = useState<number[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [date, setDate] = useState<Date>();
  const [preview, setPreview] = useState<string | null>(null);
  const [orgUnitTree, setOrgUnitTree] = useState<any[]>([]);
  const [expandedNodes, setExpandedNodes] = useState<Set<number>>(new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isActive, setIsActive] = useState(true);

  // Fetch org unit tree + assigned units
  const fetchOrgUnits = async () => {
    try {
      const res = await fetch("/api/orgunits/org-units/user-orgunit-tree/all", {
        headers: { "x-user-id": userId },
      });
      const data = await res.json();
      if (!res.ok) {
        console.error("Failed to fetch org units:", data.error);
        return;
      }
      setSelectedOrgUnitIds(data.assignedOrgUnitIds ?? []);
      setOrgUnitTree(data.tree ?? []);
    } catch (err) {
      console.error(err);
    }
  };

  // Call fetch on mount
  useEffect(() => {
    fetchOrgUnits();
  }, [userId]);

  const toggleNode = (id: number) => {
    setExpandedNodes((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleSelect = (id: number) => {
    setSelectedOrgUnitIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  function OrgUnitCheckboxTree({ units }: { units: any[] }) {
    return (
      <ul className="pl-4 space-y-1">
        {units.map((unit) => {
          const hasChildren = !!unit.children?.length;
          const isExpanded = expandedNodes.has(unit.id);
          const isChecked = selectedOrgUnitIds.includes(unit.id);

          return (
            <li key={unit.id}>
              <div className="flex items-center gap-2">
                {hasChildren ? (
                  <button onClick={() => toggleNode(unit.id)}>
                    {isExpanded ? <ChevronDown /> : <ChevronRight />}
                  </button>
                ) : (
                  <div className="w-4 h-4" />
                )}
                <Checkbox
                  checked={isChecked}
                  onCheckedChange={() => handleSelect(unit.id)}
                />
                <span className="text-sm">{unit.name}</span>
              </div>
              {hasChildren && isExpanded && (
                <OrgUnitCheckboxTree units={unit.children} />
              )}
            </li>
          );
        })}
      </ul>
    );
  }

  const handleSubmit = async () => {
    if (!title || !type || !date) {
      toast.error("Please fill all required fields (Title, Type, Expiry).");
      return;
    }

    setIsSubmitting(true);

    try {
      let fileUrl = "";
      if (file) {
        const form = new FormData();
        form.append("file", file);
        const uploadRes = await fetch("/api/upload", {
          method: "POST",
          body: form,
        });
        const uploadData = await uploadRes.json();
        if (!uploadRes.ok)
          throw new Error(uploadData.error || "File upload failed.");
        fileUrl = uploadData.url;
      }

      // Default to all org units if none selected
      // In handleSubmit before sending
      const getImmediateChildrenIds = (tree: any[]): number[] => {
        // Assuming tree is organisation-level with root children
        return tree.flatMap((org) => org.children.map((unit: any) => unit.id));
      };

      const orgUnitIdsToSend =
        selectedOrgUnitIds.length > 0
          ? selectedOrgUnitIds // send what is selected
          : getImmediateChildrenIds(orgUnitTree); // send only first-level children if none selected

      // Use organisationId from first unit in tree
      const organisationId = orgUnitTree[0]?.organisationId;
      if (!organisationId) throw new Error("Organisation ID not found.");

      const res = await fetch("/api/notices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          type,
          consideredFor: selectedRole,
          orgUnitIds: orgUnitIdsToSend,
          expiredAt: date.toISOString(),
          fileUrl,
          isActive,
          organisationId,
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to post notice.");
      }

      toast.success("Notice posted successfully.");

      // Reset form
      setTitle("");
      setDescription("");
      setType("");
      setSelectedRole("");
      setSelectedOrgUnitIds([]);
      setFile(null);
      setPreview(null);
      setDate(undefined);
      await fetchOrgUnits();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Flatten tree to get all orgUnit IDs recursively
  const getAllOrgUnitIds = (unit: any): number[] => {
    const childIds = unit.children?.flatMap(getAllOrgUnitIds) ?? [];
    return [unit.id, ...childIds];
  };

  // Filter allowed roles
  const allowedRoles = [
    "technology-transfer",
    "community-service",
    "research-and-publications",
  ];
  const filteredRoles = roles.filter((r) => allowedRoles.includes(r));

  return (
    <div className="space-y-4 max-w-xl">
      <h2 className="text-xl font-semibold">Create a New Proposal Notice</h2>

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

      {filteredRoles.length > 0 && (
        <div>
          <Label>Notice Considered For:</Label>
          <Select value={selectedRole} onValueChange={setSelectedRole}>
            <SelectTrigger>
              <SelectValue placeholder="Select role" />
            </SelectTrigger>
            <SelectContent>
              {filteredRoles.map((role) => (
                <SelectItem key={role} value={role}>
                  {role.replace(/-/g, " ")}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div>
        <Label>Notice Type:</Label>
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

      <div>
        <Label>Select For Which:</Label>
        {orgUnitTree.length === 0 ? (
          <p className="text-sm text-muted-foreground">Loading org units...</p>
        ) : (
          <OrgUnitTreeSelector
            tree={orgUnitTree}
            onChange={setSelectedOrgUnitIds} // gets only lowest children
          />
        )}
      </div>

      <div>
        <Label>Attachment</Label>
        <Input
          type="file"
          accept=".pdf,.doc,.docx,image/*"
          onChange={(e) => {
            const f = e.target.files?.[0] ?? null;
            setFile(f);
            if (!f) return setPreview(null);
            setPreview(URL.createObjectURL(f));
          }}
        />
        {file && preview && (
          <div className="mt-2">
            {file.type.startsWith("image/") ? (
              <img
                src={preview}
                alt="Preview"
                className="max-w-xs max-h-64 rounded border"
              />
            ) : (
              <iframe
                src={preview}
                width="100%"
                height="400"
                className="border rounded"
              />
            )}
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
            />
          </PopoverContent>
        </Popover>
      </div>

      <Button onClick={handleSubmit} disabled={isSubmitting}>
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Posting...
          </>
        ) : (
          "Submit Notice"
        )}
      </Button>
    </div>
  );
}
