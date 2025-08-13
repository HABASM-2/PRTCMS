"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import OrgUnitSelector from "./OrgUnitSelector";

type Organisation = {
  id: number;
  name: string;
};

type Role = {
  id: number;
  name: string;
};

type AddUserFormProps = {
  onSuccess?: () => void;
};

export default function AddUserForm({ onSuccess }: AddUserFormProps) {
  const [loading, setLoading] = useState(false);
  const [selectsLoading, setSelectsLoading] = useState(true);
  const [roles, setRoles] = useState<Role[]>([]);
  const [organisations, setOrganisations] = useState<Organisation[]>([]);
  const [selectedOrgId, setSelectedOrgId] = useState<number | null>(null);
  const [selectedOrgUnitIds, setSelectedOrgUnitIds] = useState<number[]>([]);
  const [selectedRoleIds, setSelectedRoleIds] = useState<number[]>([]);
  const [formValues, setFormValues] = useState({
    fullName: "",
    username: "",
    email: "",
    password: "",
  });
  const [managerTag, setManagerTag] = useState("");

  // extra role names for director
  const extraRoles = [
    "research-and-publications",
    "community-service",
    "technology-transfer",
  ];

  useEffect(() => {
    const fetchData = async () => {
      setSelectsLoading(true);
      try {
        const [rolesRes, orgsRes] = await Promise.all([
          fetch("/api/roles"),
          fetch("/api/organisations/select"),
        ]);

        const rolesData = await rolesRes.json();
        const orgData = await orgsRes.json();

        setRoles(rolesData);
        setOrganisations(orgData);
      } catch (error) {
        console.error("Failed to fetch roles/orgs", error);
      } finally {
        setSelectsLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormValues({ ...formValues, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const managerRole = roles.find((r) => r.name.toLowerCase() === "manager");
    const directorRole = roles.find((r) => r.name.toLowerCase() === "director");
    const extraRoleIds = roles
      .filter((r) => extraRoles.includes(r.name.toLowerCase()))
      .map((r) => r.id);

    const isManagerSelected =
      managerRole && selectedRoleIds.includes(managerRole.id);

    const isDirectorSelected =
      directorRole && selectedRoleIds.includes(directorRole.id);

    // Manager tag validation
    if (isManagerSelected && !managerTag.trim()) {
      toast.error("Manager Tag is required.");
      setLoading(false);
      return;
    }

    // Director extra roles validation
    if (isDirectorSelected) {
      const hasExtraRoleSelected = selectedRoleIds.some((id) =>
        extraRoleIds.includes(id)
      );
      if (!hasExtraRoleSelected) {
        toast.error(
          "Please select at least one of: Research & Publications, Community Service, Technology Transfer"
        );
        setLoading(false);
        return;
      }
    }

    const payload = {
      ...formValues,
      roleIds: selectedRoleIds,
      organisationId: selectedOrgId,
      orgUnitIds: selectedOrgUnitIds,
      managerTag: isManagerSelected ? managerTag : null,
    };

    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      console.log("Response from user creation:", payload);
      if (res.ok) {
        toast.success("User created successfully");
        setFormValues({ fullName: "", username: "", email: "", password: "" });
        setSelectedRoleIds([]);
        setSelectedOrgId(null);
        setSelectedOrgUnitIds([]);
        setManagerTag("");
        onSuccess?.();
      } else {
        const error = await res.json();
        toast.error(error.message || "Failed to create user");
      }
    } catch (e) {
      console.error(e);
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-6 space-y-4">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="fullName">Full Name</Label>
            <Input
              id="fullName"
              name="fullName"
              value={formValues.fullName}
              onChange={handleInputChange}
              required
            />
          </div>
          <div>
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              name="username"
              value={formValues.username}
              onChange={handleInputChange}
              required
            />
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              value={formValues.email}
              onChange={handleInputChange}
              required
            />
          </div>
          <div>
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              value={formValues.password}
              onChange={handleInputChange}
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Role Multi-Selection */}
          <div>
            <Label>Roles</Label>
            {selectsLoading ? (
              <div className="flex items-center text-muted-foreground text-sm px-2 py-3">
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Loading...
              </div>
            ) : (
              <div className="border rounded-md p-3 space-y-2 max-h-40 overflow-y-auto">
                {(() => {
                  const director = roles.find(
                    (r) => r.name.toLowerCase() === "director"
                  );

                  const baseRoles = roles.filter(
                    (r) => !extraRoles.includes(r.name.toLowerCase())
                  );

                  let orderedRoles: Role[] = [];
                  baseRoles.forEach((role) => {
                    orderedRoles.push(role);
                    if (
                      director &&
                      role.id === director.id &&
                      selectedRoleIds.includes(director.id)
                    ) {
                      orderedRoles.push(
                        ...roles.filter((r) =>
                          extraRoles.includes(r.name.toLowerCase())
                        )
                      );
                    }
                  });

                  return orderedRoles.map((role) => {
                    const checked = selectedRoleIds.includes(role.id);
                    const isManager = role.name.toLowerCase() === "manager";
                    const isExtraRole = extraRoles.includes(
                      role.name.toLowerCase()
                    );

                    return (
                      <div
                        key={role.id}
                        className={`flex items-center gap-2 ${
                          isExtraRole ? "pl-6 border-l border-muted" : ""
                        }`}
                      >
                        <Checkbox
                          id={`role-${role.id}`}
                          checked={checked}
                          onCheckedChange={(checked) => {
                            setSelectedRoleIds((prev) =>
                              checked
                                ? [...prev, role.id]
                                : prev.filter((id) => id !== role.id)
                            );
                          }}
                        />
                        <Label
                          htmlFor={`role-${role.id}`}
                          className={`text-sm ${
                            isExtraRole ? "text-muted-foreground" : ""
                          }`}
                        >
                          {role.name}
                        </Label>

                        {isManager && checked && (
                          <Input
                            className="ml-2 h-8 w-60"
                            placeholder="Manager Tag"
                            value={managerTag}
                            onChange={(e) => setManagerTag(e.target.value)}
                            required
                          />
                        )}
                      </div>
                    );
                  });
                })()}
              </div>
            )}
          </div>

          {/* Organisation Select */}
          <div>
            <Label>Organisation</Label>
            <Select
              onValueChange={(val) => setSelectedOrgId(Number(val))}
              value={selectedOrgId?.toString() || ""}
              disabled={selectsLoading}
            >
              <SelectTrigger>
                {selectsLoading ? (
                  <div className="flex items-center text-muted-foreground">
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Loading...
                  </div>
                ) : (
                  <SelectValue placeholder="Select an organisation" />
                )}
              </SelectTrigger>
              <SelectContent>
                {organisations.map((org) => (
                  <SelectItem key={org.id} value={org.id.toString()}>
                    {org.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Org Units */}
        {selectedOrgId && (
          <div>
            <Label className="mb-2 block">Org Units</Label>
            <OrgUnitSelector
              userId={0}
              organisationId={selectedOrgId}
              onChange={(ids) => setSelectedOrgUnitIds(ids)}
            />
            {selectedOrgUnitIds.length > 0 && (
              <p className="text-xs text-muted-foreground mt-1">
                {selectedOrgUnitIds.length} unit
                {selectedOrgUnitIds.length > 1 ? "s" : ""} selected
              </p>
            )}
          </div>
        )}

        <Button type="submit" disabled={loading}>
          {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          Add User
        </Button>
      </form>
    </Card>
  );
}
