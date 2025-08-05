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
  // Utility: flatten tree, but keep path to identify node uniquely
  const flattenTreeWithPaths = (
    units: OrgUnit[],
    pathPrefix: string[] = []
  ): { node: OrgUnit; path: string; parentPath: string | null }[] => {
    let result: { node: OrgUnit; path: string; parentPath: string | null }[] =
      [];

    units.forEach((unit, index) => {
      const currentPath = [...pathPrefix, index.toString()];
      const pathStr = currentPath.join("-");

      result.push({
        node: unit,
        path: pathStr,
        parentPath: pathPrefix.length ? pathPrefix.join("-") : null,
      });

      if (unit.children) {
        result = result.concat(
          flattenTreeWithPaths(unit.children, currentPath)
        );
      }
    });

    return result;
  };

  const flatNodes = flattenTreeWithPaths(tree);

  // Find top root path and id
  const topRoot = tree.length > 0 ? tree[0] : null;
  const rootPath = "0"; // root always at index 0 in tree

  // Selected state uses path strings internally, but for external onChange we only send ids
  // We'll keep a map of path->nodeId
  const pathToId = new Map(flatNodes.map(({ node, path }) => [path, node.id]));

  // Initialize selected by matching selectedIds with nodes (by id)
  const initialSelectedPaths = new Set<string>(
    flatNodes
      .filter(({ node }) => selectedIds.includes(node.id))
      .map(({ path }) => path)
  );

  // Always include rootPath in selection
  // initialSelectedPaths.add(rootPath);

  const [selectedPaths, setSelectedPaths] =
    useState<Set<string>>(initialSelectedPaths);

  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  // Whenever selectedPaths changes, notify onChange with the list of unique ids
  useEffect(() => {
    const ids = new Set<number>();
    selectedPaths.forEach((path) => {
      if (path === rootPath) return; // Skip root
      const id = pathToId.get(path);
      if (id !== undefined) ids.add(id);
    });
    onChange(Array.from(ids));
  }, [selectedPaths]);

  const toggleExpand = (path: string) => {
    setExpanded((prev) => ({ ...prev, [path]: !prev[path] }));
  };

  // Helper: get parent path of a node path, or null if root
  const getParentPath = (path: string): string | null => {
    const parts = path.split("-");
    if (parts.length <= 1) return null;
    return parts.slice(0, -1).join("-");
  };

  // Select node with parents (by path)
  const selectWithParents = (path: string): Set<string> => {
    const updated = new Set(selectedPaths);
    updated.add(path);

    // Walk up and add parents, but skip rootPath
    let parent = getParentPath(path);
    while (parent !== null && parent !== rootPath) {
      updated.add(parent);
      parent = getParentPath(parent);
    }

    return updated;
  };

  // Remove node and all its children (by path)
  const removeWithChildren = (path: string): Set<string> => {
    const updated = new Set(selectedPaths);

    for (const p of pathToId.keys()) {
      if (p === path || p.startsWith(path + "-")) {
        updated.delete(p);
      }
    }
    return updated;
  };

  const renderTree = (units: OrgUnit[], pathPrefix: string[] = []) => {
    return units.map((unit, index) => {
      const path = [...pathPrefix, index.toString()].join("-");
      const isChecked = selectedPaths.has(path);
      const hasChildren = unit.children && unit.children.length > 0;
      const isOpen = expanded[path];
      const isRoot = path === rootPath;

      return (
        <div key={path} className="pl-4">
          <div className="flex items-center gap-2">
            {hasChildren ? (
              <Button
                variant="ghost"
                size="icon"
                type="button"
                onClick={() => toggleExpand(path)}
              >
                {isOpen ? (
                  <ChevronDown size={16} />
                ) : (
                  <ChevronRight size={16} />
                )}
              </Button>
            ) : (
              <div className="w-8" />
            )}

            <Checkbox
              checked={isRoot ? true : isChecked}
              disabled={isRoot}
              onCheckedChange={(checked) => {
                if (isRoot) return;
                if (checked) {
                  setSelectedPaths(selectWithParents(path));
                } else {
                  setSelectedPaths(removeWithChildren(path));
                }
              }}
            />
            <span className={isRoot ? "font-semibold text-primary" : ""}>
              {unit.name}
            </span>
          </div>

          {hasChildren && isOpen && (
            <div className="ml-4 border-l border-gray-200 dark:border-gray-700 pl-2">
              {renderTree(unit.children!, [...pathPrefix, index.toString()])}
            </div>
          )}
        </div>
      );
    });
  };

  return <div>{renderTree(tree)}</div>;
}
