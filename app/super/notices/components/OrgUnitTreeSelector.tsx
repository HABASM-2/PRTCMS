"use client";

import { useEffect, useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronRight } from "lucide-react";

interface OrgUnit {
  id: number;
  name: string;
  children?: OrgUnit[];
}

interface OrgUnitTreeSelectorProps {
  treeData: OrgUnit[];
  selectedIds: number[]; // current checked items
  onSelectionChange: (selected: number[]) => void;
  assignedOrgUnitIds: number[]; // user assigned orgUnitIds like [2, 5]
}

function collectDescendants(node: OrgUnit): number[] {
  let result: number[] = [];
  if (node.children) {
    for (const child of node.children) {
      result.push(child.id);
      result = result.concat(collectDescendants(child));
    }
  }
  return result;
}

function collectAllowedIds(
  tree: OrgUnit[],
  assignedIds: number[]
): Set<number> {
  const allowed = new Set<number>();

  function dfs(node: OrgUnit) {
    if (assignedIds.includes(node.id)) {
      const descendants = collectDescendants(node);
      descendants.forEach((id) => allowed.add(id));
    } else if (node.children) {
      node.children.forEach(dfs);
    }
  }

  tree.forEach(dfs);
  return allowed;
}

const OrgUnitTreeSelector = ({
  treeData,
  selectedIds,
  onSelectionChange,
  assignedOrgUnitIds,
}: OrgUnitTreeSelectorProps) => {
  const [expanded, setExpanded] = useState<Record<number, boolean>>({});

  const allowedIds = collectAllowedIds(treeData, assignedOrgUnitIds);

  const isChecked = (id: number) => selectedIds.includes(id);

  const toggleSelection = (id: number) => {
    const newSelected = isChecked(id)
      ? selectedIds.filter((sid) => sid !== id)
      : [...selectedIds, id];
    onSelectionChange(newSelected);
  };

  const renderTree = (nodes: OrgUnit[]) => {
    return nodes.map((node) => {
      const isExpanded = expanded[node.id];
      const hasChildren = node.children && node.children.length > 0;

      const isDisabled = !allowedIds.has(node.id); // only descendants of assigned are enabled

      return (
        <div key={node.id} className="ml-4">
          <div className="flex items-center space-x-2">
            {hasChildren && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() =>
                  setExpanded((prev) => ({
                    ...prev,
                    [node.id]: !prev[node.id],
                  }))
                }
              >
                {isExpanded ? (
                  <ChevronDown size={16} />
                ) : (
                  <ChevronRight size={16} />
                )}
              </Button>
            )}
            {!hasChildren && <div className="w-4" />}{" "}
            {/* placeholder for alignment */}
            <Checkbox
              checked={isChecked(node.id)}
              onCheckedChange={() => toggleSelection(node.id)}
              disabled={isDisabled}
            />
            <span className={isDisabled ? "text-gray-400" : ""}>
              {node.name}
            </span>
          </div>
          {hasChildren && isExpanded && renderTree(node.children!)}
        </div>
      );
    });
  };

  return <div>{renderTree(treeData)}</div>;
};

export default OrgUnitTreeSelector;
