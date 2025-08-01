"use client";

import { useState, useEffect } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronRight } from "lucide-react";

interface OrgUnit {
  id: number;
  name: string;
  children?: OrgUnit[];
  parentId?: number | null;
}

interface Props {
  tree: OrgUnit[];
  selectedIds?: number[];
  onChange: (ids: number[]) => void;
}

export default function OrgUnitTreeSelector({
  tree,
  selectedIds = [],
  onChange,
}: Props) {
  const [selected, setSelected] = useState<number[]>(selectedIds);
  const [expanded, setExpanded] = useState<Record<number, boolean>>({});

  useEffect(() => {
    onChange(selected);
  }, [selected]);

  const toggleExpand = (id: number) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const selectWithParents = (
    unit: OrgUnit,
    allUnits: OrgUnit[],
    current: number[]
  ): number[] => {
    const updated = new Set(current);
    updated.add(unit.id);

    let parentId = unit.parentId;
    while (parentId) {
      const parent = allUnits.find((u) => u.id === parentId);
      if (parent) {
        updated.add(parent.id);
        parentId = parent.parentId;
      } else break;
    }
    return Array.from(updated);
  };

  const removeWithChildren = (unit: OrgUnit, current: number[]): number[] => {
    const updated = new Set(current);
    const removeIds = collectChildren(unit);
    removeIds.push(unit.id);
    for (const id of removeIds) updated.delete(id);
    return Array.from(updated);
  };

  const collectChildren = (unit: OrgUnit): number[] => {
    const result: number[] = [];
    const stack = [...(unit.children || [])];
    while (stack.length) {
      const current = stack.pop()!;
      result.push(current.id);
      if (current.children) stack.push(...current.children);
    }
    return result;
  };

  const renderTree = (units: OrgUnit[], allUnits: OrgUnit[], depth = 0) => {
    return units.map((unit) => {
      const isChecked = selected.includes(unit.id);
      const hasChildren = unit.children && unit.children.length > 0;
      const isOpen = expanded[unit.id];

      return (
        <div key={unit.id} className="pl-4">
          <div className="flex items-center gap-2">
            {hasChildren && (
              <Button
                variant="ghost"
                size="icon"
                type="button"
                onClick={() => toggleExpand(unit.id)}
              >
                {isOpen ? (
                  <ChevronDown size={16} />
                ) : (
                  <ChevronRight size={16} />
                )}
              </Button>
            )}
            {!hasChildren && <div className="w-8" />} {/* spacer */}
            <Checkbox
              checked={isChecked}
              onCheckedChange={(checked) => {
                if (checked) {
                  setSelected(
                    selectWithParents(unit, flattenTree(tree), selected)
                  );
                } else {
                  setSelected(removeWithChildren(unit, selected));
                }
              }}
            />
            <span>{unit.name}</span>
          </div>

          {hasChildren && isOpen && (
            <div className="ml-4 border-l border-gray-200 dark:border-gray-700 pl-2">
              {renderTree(unit.children!, allUnits, depth + 1)}
            </div>
          )}
        </div>
      );
    });
  };

  const flattenTree = (units: OrgUnit[]): OrgUnit[] => {
    const result: OrgUnit[] = [];
    const traverse = (list: OrgUnit[]) => {
      for (const unit of list) {
        result.push(unit);
        if (unit.children) traverse(unit.children);
      }
    };
    traverse(units);
    return result;
  };

  return <div>{renderTree(tree, flattenTree(tree))}</div>;
}
