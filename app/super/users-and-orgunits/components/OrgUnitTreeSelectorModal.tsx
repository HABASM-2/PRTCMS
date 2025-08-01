"use client";

import { useEffect, useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2 } from "lucide-react";

interface OrgUnit {
  id: number;
  name: string;
  parentId: number | null;
  children: OrgUnit[];
}

interface Props {
  userId?: number; // ← now optional
  organisationId: number;
  selectedOrgUnitIds: number[];
  onChange: (selectedIds: number[]) => void;
}

export default function OrgUnitTreeSelectorModal({
  userId,
  organisationId,
  onChange,
}: Props) {
  const [tree, setTree] = useState<OrgUnit[]>([]);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/orgunits/org-units/id/?id=${organisationId}${
            userId ? `&userId=${userId}` : ""
          }`
        );
        const data = await res.json();
        setTree(
          (data.tree || []).map((unit: any) => ({
            ...unit,
            children: Array.isArray(unit.children) ? unit.children : [],
          }))
        );
        setSelectedIds(data.assignedOrgUnitIds);
        onChange(data.assignedOrgUnitIds);
      } catch (err) {
        console.error("Failed to load org units", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [organisationId, userId, onChange]);

  const toggleCheckbox = (id: number, isChecked: boolean) => {
    const newSelected = new Set(selectedIds);

    const findPathToUnit = (
      units: OrgUnit[],
      targetId: number,
      path: OrgUnit[] = []
    ): OrgUnit[] | null => {
      for (const unit of units) {
        const currentPath = [...path, unit];
        if (unit.id === targetId) return currentPath;
        const result = findPathToUnit(unit.children, targetId, currentPath);
        if (result) return result;
      }
      return null;
    };

    const findUnit = (
      units: OrgUnit[],
      targetId: number
    ): OrgUnit | undefined => {
      for (const unit of units) {
        if (unit.id === targetId) return unit;
        const found = findUnit(unit.children, targetId);
        if (found) return found;
      }
    };

    const updateChildren = (unit: OrgUnit, select: boolean) => {
      if (select) {
        newSelected.add(unit.id);
      } else {
        newSelected.delete(unit.id);
      }
      unit.children.forEach((child) => updateChildren(child, select));
    };

    const path = findPathToUnit(tree, id);
    const unit = findUnit(tree, id);
    if (!path || !unit) return;

    if (isChecked) {
      // Select all parents and this unit
      path.forEach((u) => newSelected.add(u.id));
      // Select all children
      updateChildren(unit, true);
    } else {
      // Deselect this unit and its children
      updateChildren(unit, false);
    }

    const result = Array.from(newSelected);
    setSelectedIds(result);
    onChange(result);
  };

  const renderTree = (units: OrgUnit[]) => {
    return (
      <ul className="pl-4 space-y-1">
        {units.map((unit) => (
          <li key={unit.id}>
            <div className="flex items-center space-x-2">
              <Checkbox
                checked={selectedIds.includes(unit.id)}
                onCheckedChange={(checked: boolean) =>
                  toggleCheckbox(unit.id, checked as boolean)
                }
              />
              <span>{unit.name}</span>
            </div>
            {/* 💡 Defensive check here */}
            {Array.isArray(unit.children) &&
              unit.children.length > 0 &&
              renderTree(unit.children)}
          </li>
        ))}
      </ul>
    );
  };

  return (
    <div className="mt-2 max-h-64 overflow-y-auto border rounded p-2">
      {loading ? (
        <div className="flex items-center text-muted-foreground text-sm">
          <Loader2 className="animate-spin w-4 h-4 mr-2" />
          Loading organisation units...
        </div>
      ) : tree.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No organisation units found.
        </p>
      ) : (
        renderTree(tree)
      )}
    </div>
  );
}
