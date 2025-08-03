"use client";

import { useEffect, useState } from "react";
import { Label } from "@/components/ui/label";
import { Select, SelectItem, SelectValue, SelectTrigger, SelectContent } from "@/components/ui/select";

type Role = { id: number; name: string };

export default function RoleSelect({ userId, onChange, selected }: {
  userId: number;
  onChange: (value: number[]) => void;
  selected: number[];
}) {
  const [roles, setRoles] = useState<Role[]>([]);
  const [selectedIds, setSelectedIds] = useState<number[]>(selected);

  useEffect(() => {
    async function fetchRoles() {
      const res = await fetch(`/api/roles/user?id=${userId}`);
      const data = await res.json();
      setRoles(data.allRoles);
      setSelectedIds(data.userRoleIds);
      onChange(data.userRoleIds); // prepopulate parent form
    }

    fetchRoles();
  }, [userId]);

  const toggleSelect = (id: number) => {
    const updated = selectedIds.includes(id)
      ? selectedIds.filter((r) => r !== id)
      : [...selectedIds, id];
    setSelectedIds(updated);
    onChange(updated);
  };

  return (
    <div>
      <Label className="mb-2">Roles</Label>
      <div className="space-y-2">
        {roles.map((role) => (
          <div key={role.id} className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={selectedIds.includes(role.id)}
              onChange={() => toggleSelect(role.id)}
              id={`role-${role.id}`}
              className="h-4 w-4"
            />
            <label htmlFor={`role-${role.id}`}>{role.name}</label>
          </div>
        ))}
      </div>
    </div>
  );
}
