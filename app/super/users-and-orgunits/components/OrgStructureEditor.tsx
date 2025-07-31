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
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Plus, Pencil, Trash2, ChevronDown, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
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

  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newUnitName, setNewUnitName] = useState("");
  const [addingToParentId, setAddingToParentId] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/organisations/list")
      .then((res) => res.json())
      .then(setOrganisations);
  }, []);

  useEffect(() => {
    if (selectedOrg) {
      fetch(`/api/orgunits/tree?id=${selectedOrg}`)
        .then((res) => res.json())
        .then(setTree);
    }
  }, [selectedOrg]);

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
      const units = await fetch(`/api/orgunits/tree?id=${selectedOrg}`, {
        cache: "no-store",
      }).then((r) => r.json());
      setTree(units);
    } else {
      toast.error("Failed to add unit");
    }
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
          <span className="font-medium text-foreground dark:text-white">
            {node.name}
          </span>

          <div className="ml-auto flex gap-1">
            <Button
              size="icon"
              variant="ghost"
              onClick={() => toast.info("Rename coming soon")}
            >
              {" "}
              <Pencil className="w-4 h-4" />{" "}
            </Button>
            <Button
              size="icon"
              variant="ghost"
              onClick={() => openAddDialog(node.id)}
            >
              {" "}
              <Plus className="w-4 h-4" />{" "}
            </Button>
            <Button
              size="icon"
              variant="ghost"
              onClick={() => toast.warning("Delete coming soon")}
            >
              {" "}
              <Trash2 className="w-4 h-4 text-red-600" />{" "}
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
          <SelectValue placeholder="Select an organisation" />
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
            {tree.length === 0 ? (
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
            <Button onClick={handleAddUnit}>Add</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
