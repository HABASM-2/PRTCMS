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
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner"; // ✅ Sonner toast

interface UploadNoticeProps {
  userId: string;
}

export default function UploadNotice({ userId }: UploadNoticeProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedOrgUnitIds, setSelectedOrgUnitIds] = useState<number[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [date, setDate] = useState<Date>();
  const [preview, setPreview] = useState<string | null>(null);

  const [orgUnitTree, setOrgUnitTree] = useState<any[]>([]);
  const [assignedOrgUnitIds, setAssignedOrgUnitIds] = useState<number[]>([]);
  const [ancestorOrgUnitIds, setAncestorOrgUnitIds] = useState<Set<number>>(
    new Set()
  );
  const [descendantOrgUnitIds, setDescendantOrgUnitIds] = useState<Set<number>>(
    new Set()
  );
  const [expandedNodes, setExpandedNodes] = useState<Set<number>>(new Set());
  const [siblingOrgUnitIds, setSiblingOrgUnitIds] = useState<Set<number>>(
    new Set()
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Helpers...
  function getAncestorIds(tree: any[], assignedIds: number[]): Set<number> {
    const ancestorIds = new Set<number>();
    const map = new Map<number, any>();
    function mapUnits(units: any[]) {
      for (const unit of units) {
        map.set(unit.id, unit);
        if (unit.children) mapUnits(unit.children);
      }
    }
    mapUnits(tree);
    for (const assignedId of assignedIds) {
      let current = map.get(assignedId);
      while (current?.parentId && map.has(current.parentId)) {
        ancestorIds.add(current.parentId);
        current = map.get(current.parentId);
      }
    }
    return ancestorIds;
  }

  function collectSiblingIds(tree: any[], assignedIds: number[]): Set<number> {
    const siblings = new Set<number>();
    function dfs(units: any[]) {
      for (const unit of units) {
        if (unit.children?.length > 0) {
          const childrenIds = unit.children.map((child: any) => child.id);
          const assignedInChildren = childrenIds.filter((id: number) =>
            assignedIds.includes(id)
          );
          if (assignedInChildren.length > 0) {
            childrenIds.forEach((id: number) => {
              if (!assignedIds.includes(id)) siblings.add(id);
            });
          }
          unit.children.forEach((child: any) => dfs([child]));
        }
      }
    }
    dfs(tree);
    return siblings;
  }

  function collectDescendants(tree: any[], assignedIds: number[]): Set<number> {
    const descendants = new Set<number>();
    function markDescendants(node: any) {
      if (node.children) {
        for (const child of node.children) {
          descendants.add(child.id);
          markDescendants(child);
        }
      }
    }
    function dfs(nodes: any[]) {
      for (const node of nodes) {
        if (assignedIds.includes(node.id)) {
          markDescendants(node);
        } else if (node.children) {
          dfs(node.children);
        }
      }
    }
    dfs(tree);
    return descendants;
  }

  useEffect(() => {
    const fetchOrgUnits = async () => {
      const res = await fetch(
        `/api/orgunits/org-units/user-orgunit-tree?id=${userId}`
      );
      const data = await res.json();
      if (!res.ok) {
        console.error("Failed to fetch org units:", data.error);
        return;
      }
      const ancestorIds = getAncestorIds(data.tree, data.assignedOrgUnitIds);
      const descendantIds = collectDescendants(
        data.tree,
        data.assignedOrgUnitIds
      );
      const siblingIds = collectSiblingIds(data.tree, data.assignedOrgUnitIds);

      setAncestorOrgUnitIds(ancestorIds);
      setDescendantOrgUnitIds(descendantIds);
      setSiblingOrgUnitIds(siblingIds);
      setAssignedOrgUnitIds(data.assignedOrgUnitIds);
      setOrgUnitTree(data.tree);
      setSelectedOrgUnitIds([...data.assignedOrgUnitIds, ...ancestorIds]);
    };
    fetchOrgUnits();
  }, []);

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
          const isAssigned = assignedOrgUnitIds.includes(unit.id);
          const isAncestor = ancestorOrgUnitIds.has(unit.id);
          const isDescendant = descendantOrgUnitIds.has(unit.id);
          const isChecked =
            isAssigned || isAncestor || selectedOrgUnitIds.includes(unit.id);
          const isSibling = siblingOrgUnitIds.has(unit.id);
          const isDisabled =
            isAssigned || isAncestor || isSibling || !isDescendant;

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
                  disabled={isDisabled}
                  onCheckedChange={() => !isDisabled && handleSelect(unit.id)}
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
                <OrgUnitCheckboxTree units={unit.children!} />
              )}
            </li>
          );
        })}
      </ul>
    );
  }

  const handleSubmit = async () => {
    if (!title || !date || selectedOrgUnitIds.length === 0) {
      toast.error("Please fill all required fields.");
      return;
    }

    const validAssignedId = selectedOrgUnitIds.find((id) =>
      assignedOrgUnitIds.includes(id)
    );

    if (!validAssignedId) {
      toast.error("Please select one assigned org unit to post notice.");
      return;
    }

    setIsSubmitting(true);
    try {
      let fileUrl = "";
      if (file) {
        const form = new FormData();
        form.append("file", file);
        const r = await fetch("/api/upload", { method: "POST", body: form });
        const d = await r.json();
        if (!r.ok) throw new Error("File upload failed.");
        fileUrl = d.url;
      }

      const res = await fetch("/api/notices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          orgUnitId: validAssignedId,
          expiredAt: date.toISOString(),
          fileUrl,
        }),
      });

      if (res.ok) {
        toast.success("Notice posted successfully.");
        setTitle("");
        setDescription("");
        setFile(null);
        setDate(undefined);
        setPreview(null);
        setSelectedOrgUnitIds([]);
      } else {
        const error = await res.json();
        throw new Error(error.error || "Failed to post notice.");
      }
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4 max-w-xl">
      <h2 className="text-xl font-semibold">Create a New Proposal Notice</h2>
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
        <Label>Org Units</Label>
        {orgUnitTree.length === 0 ? (
          <p className="text-sm text-muted-foreground">Loading org units...</p>
        ) : (
          <OrgUnitCheckboxTree units={orgUnitTree} />
        )}
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
