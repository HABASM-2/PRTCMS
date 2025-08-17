"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { CalendarIcon, Loader2, ChevronDown, ChevronRight } from "lucide-react";
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

interface OrgUnitNode {
  id: number;
  name: string;
  children: OrgUnitNode[];
}

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

  const [orgUnitTree, setOrgUnitTree] = useState<OrgUnitNode[]>([]);
  const [selectedOrgUnitIds, setSelectedOrgUnitIds] = useState<number[]>([]);
  const [expandedNodes, setExpandedNodes] = useState<Set<number>>(new Set());
  const [unitMap, setUnitMap] = useState<
    Map<number, OrgUnitNode & { parentId: number | null }>
  >(new Map());

  const [type, setType] = useState(notice.type || "JUST_NOTICE");
  const [isActive, setIsActive] = useState(notice.isActive ?? true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch org unit tree
  useEffect(() => {
    const fetchOrgUnits = async () => {
      try {
        const res = await fetch(
          "/api/orgunits/org-units/user-orgunit-tree/all",
          { headers: { "x-user-id": String(notice.createdById) } }
        );
        const data = await res.json();
        if (!res.ok) {
          console.error("Failed to fetch org units:", data.error);
          return;
        }

        setOrgUnitTree(data.tree ?? []);

        // Build unit map for parent lookup
        const map = new Map<
          number,
          OrgUnitNode & { parentId: number | null }
        >();
        const buildMap = (
          node: OrgUnitNode,
          parentId: number | null = null
        ) => {
          map.set(node.id, { ...node, parentId });
          node.children.forEach((child) => buildMap(child, node.id));
        };
        data.tree?.forEach(buildMap);
        setUnitMap(map);

        // Preselect org units including parents
        const preselectedIds =
          notice.orgUnits?.map((ou: any) => ou.orgUnitId) || [];
        const allSelected = new Set<number>();

        preselectedIds.forEach((id: any) => {
          allSelected.add(id);
          let current = map.get(id);
          while (current?.parentId) {
            allSelected.add(current.parentId);
            current = map.get(current.parentId);
          }
        });

        setSelectedOrgUnitIds(Array.from(allSelected));
        // setExpandedNodes(new Set(Array.from(allSelected)));
        setExpandedNodes(new Set());
      } catch (err) {
        console.error(err);
      }
    };

    fetchOrgUnits();
  }, [notice.createdById, notice.orgUnits]);

  const toggleNode = (id: number) => {
    setExpandedNodes((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const getAllChildrenIds = (node: OrgUnitNode): number[] => {
    return node.children.reduce(
      (acc: number[], child) => [...acc, child.id, ...getAllChildrenIds(child)],
      []
    );
  };

  const handleSelect = (id: number) => {
    setSelectedOrgUnitIds((prev) => {
      const newSelected = new Set(prev);
      const node = unitMap.get(id);
      if (!node) return prev;

      if (newSelected.has(id)) {
        // Deselect node and all children
        newSelected.delete(id);
        getAllChildrenIds(node).forEach((cid) => newSelected.delete(cid));
      } else {
        // Select node and all parents
        newSelected.add(id);
        let current = node;
        while (current.parentId) {
          newSelected.add(current.parentId);
          current = unitMap.get(current.parentId)!;
        }
      }

      return Array.from(newSelected);
    });
  };

  const getLowestSelected = (): number[] => {
    const selectedSet = new Set(selectedOrgUnitIds);
    const leaves: number[] = [];

    const dfs = (node: OrgUnitNode) => {
      if (selectedSet.has(node.id)) {
        const hasSelectedChild = node.children.some((c) =>
          selectedSet.has(c.id)
        );
        if (!hasSelectedChild) leaves.push(node.id);
      }
      node.children.forEach(dfs);
    };

    orgUnitTree.forEach(dfs);
    return leaves;
  };

  const OrgUnitCheckboxTree = ({ units }: { units: OrgUnitNode[] }) => {
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
  };

  const handleUpdate = async () => {
    if (!title || !date || selectedOrgUnitIds.length === 0) {
      toast.error("Please fill all required fields.");
      return;
    }

    setIsSubmitting(true);
    try {
      let updatedFileUrl = fileUrl;
      if (fileDeleted) updatedFileUrl = null;

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
          orgUnitIds: getLowestSelected(),
          expiredAt: date.toISOString(),
          fileUrl: updatedFileUrl,
          type,
          isActive,
        }),
      });

      if (res.ok) {
        toast.success("Notice updated.");
        onSuccess();
      } else {
        const error = await res.json();
        throw new Error(error.error || "Failed to update notice.");
      }
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4 max-w-xl">
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
        <Label>Select Org Units</Label>
        {orgUnitTree.length === 0 ? (
          <p className="text-sm text-muted-foreground">Loading org units...</p>
        ) : (
          <OrgUnitCheckboxTree units={orgUnitTree} />
        )}
      </div>

      <div>
        <Label>Notice Type</Label>
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
