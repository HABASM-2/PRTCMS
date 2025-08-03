// Updated Organisation Structure Editor with improved loading states

"use client";

import { useEffect, useState } from "react";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Plus,
  Pencil,
  Trash2,
  ChevronDown,
  ChevronRight,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { AnimatePresence, motion } from "framer-motion";

// Org unit type
type OrgUnit = {
  id: number;
  name: string;
  children: OrgUnit[];
};

export default function OrgStructureEditor() {
  const [organisations, setOrganisations] = useState<
    { id: number; name: string }[]
  >([]);
  const [selectedOrg, setSelectedOrg] = useState<number | null>(null);
  const [tree, setTree] = useState<OrgUnit[]>([]);
  const [expanded, setExpanded] = useState<{ [key: number]: boolean }>({});

  const [orgLoading, setOrgLoading] = useState(false);
  const [treeLoading, setTreeLoading] = useState(false);

  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newUnitName, setNewUnitName] = useState("");
  const [addingToParentId, setAddingToParentId] = useState<number | null>(null);

  const [editUnitId, setEditUnitId] = useState<number | null>(null);
  const [editUnitName, setEditUnitName] = useState<string>("");
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    id: number | null;
  }>({ open: false, id: null });

  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    setOrgLoading(true);
    fetch("/api/organisations/list")
      .then((res) => res.json())
      .then(setOrganisations)
      .finally(() => setOrgLoading(false));
  }, []);

  useEffect(() => {
    if (selectedOrg) {
      setTreeLoading(true);
      fetch(`/api/orgunits/tree?id=${selectedOrg}`)
        .then((res) => res.json())
        .then(setTree)
        .finally(() => setTreeLoading(false));
    }
  }, [selectedOrg]);

  const reloadTree = async () => {
    if (!selectedOrg) return;
    setTreeLoading(true);
    const units = await fetch(`/api/orgunits/tree?id=${selectedOrg}`, {
      cache: "no-store",
    }).then((r) => r.json());
    setTree(units);
    setTreeLoading(false);
  };

  const toggle = (id: number) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const openAddDialog = (parentId: number | null) => {
    setAddingToParentId(parentId);
    setNewUnitName("");
    setShowAddDialog(true);
  };

  const handleAddUnit = async () => {
    if (!selectedOrg || !newUnitName.trim()) return;

    setSaving(true);
    const res = await fetch("/api/orgunits/create", {
      method: "POST",
      body: JSON.stringify({
        organisationId: selectedOrg,
        name: newUnitName,
        parentId: addingToParentId,
      }),
    });

    if (res.ok) {
      toast.success("Unit added");
      setShowAddDialog(false);
      setNewUnitName("");
      await reloadTree();
    } else {
      toast.error("Failed to add unit");
    }
    setSaving(false);
  };

  const handleRename = async (id: number) => {
    setSaving(true);
    const res = await fetch(`/api/orgunits/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ name: editUnitName }),
    });

    if (res.ok) {
      toast.success("Unit renamed");
      setEditUnitId(null);
      await reloadTree();
    } else {
      toast.error("Rename failed");
    }
    setSaving(false);
  };

  const handleDelete = async (id: number) => {
    setDeleting(true);
    const res = await fetch(`/api/orgunits/${id}`, {
      method: "DELETE",
    });

    if (res.ok) {
      toast.success("Unit deleted");
      setDeleteDialog({ open: false, id: null });
      await reloadTree();
    } else {
      toast.error("Delete failed");
    }
    setDeleting(false);
  };

  const renderNode = (node: OrgUnit) => {
    const children = node.children ?? [];

    return (
      <div key={node.id} className="ml-4 border-l pl-3 mt-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => toggle(node.id)}
            className="text-muted-foreground"
          >
            {children.length > 0 ? (
              expanded[node.id] ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )
            ) : (
              <span className="w-4 h-4" />
            )}
          </button>

          {editUnitId === node.id ? (
            <div className="flex items-center gap-2">
              <Input
                value={editUnitName}
                onChange={(e) => setEditUnitName(e.target.value)}
                className="h-7"
              />
              <Button
                size="sm"
                onClick={() => handleRename(node.id)}
                disabled={saving}
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save"}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setEditUnitId(null)}
              >
                Cancel
              </Button>
            </div>
          ) : (
            <span className="font-medium text-foreground dark:text-white">
              {node.name}
            </span>
          )}

          <div className="ml-auto flex gap-1">
            <Button
              size="icon"
              variant="ghost"
              onClick={() => {
                setEditUnitId(node.id);
                setEditUnitName(node.name);
              }}
            >
              <Pencil className="w-4 h-4" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              onClick={() => openAddDialog(node.id)}
            >
              <Plus className="w-4 h-4" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              onClick={() => setDeleteDialog({ open: true, id: node.id })}
            >
              <Trash2 className="w-4 h-4 text-red-600" />
            </Button>
          </div>
        </div>

        <AnimatePresence initial={false}>
          {expanded[node.id] && children.length > 0 && (
            <motion.div
              className="ml-4"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
            >
              {children.map((child) => renderNode(child))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  return (
    <div>
      <Select onValueChange={(val) => setSelectedOrg(Number(val))}>
        <SelectTrigger className="w-64 mb-4">
          <SelectValue
            placeholder={orgLoading ? "Loading..." : "Select an organisation"}
          />
        </SelectTrigger>
        <SelectContent>
          {organisations.map((org) => (
            <SelectItem key={org.id} value={org.id.toString()}>
              {org.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {selectedOrg && (
        <>
          <Button className="mb-2" onClick={() => openAddDialog(null)}>
            <Plus className="w-4 h-4 mr-1" /> Add Root Unit
          </Button>

          <div className="border rounded-md p-2 bg-white dark:bg-zinc-900">
            {treeLoading ? (
              <p className="text-muted-foreground text-sm flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" /> Loading units...
              </p>
            ) : tree.length === 0 ? (
              <p className="text-muted-foreground text-sm">No units yet.</p>
            ) : (
              tree.map(renderNode)
            )}
          </div>
        </>
      )}

      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Unit</DialogTitle>
          </DialogHeader>
          <Input
            placeholder="Enter unit name"
            value={newUnitName}
            onChange={(e) => setNewUnitName(e.target.value)}
          />
          <DialogFooter>
            <Button onClick={() => setShowAddDialog(false)} variant="ghost">
              Cancel
            </Button>
            <Button onClick={handleAddUnit} disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Add"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={deleteDialog.open}
        onOpenChange={(open) => setDeleteDialog({ open, id: deleteDialog.id })}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
          </DialogHeader>
          <p>Are you sure you want to delete this unit?</p>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setDeleteDialog({ open: false, id: null })}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={deleting}
              onClick={() => deleteDialog.id && handleDelete(deleteDialog.id)}
            >
              {deleting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                "Delete"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
