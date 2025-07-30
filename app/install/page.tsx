"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

type FormData = {
  fullName: string;
  email: string;
  username: string;
  password: string;
};

export default function InstallPage() {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormData>({
    fullName: "",
    email: "",
    username: "",
    password: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    const res = await fetch("/api/install", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, role: "super" }),
    });

    const data = await res.json();
    if (res.ok) {
      alert("Super user created!");
    } else {
      alert(data.message || "Failed to create super user");
    }
  };

  return (
    <main className="max-w-md mx-auto mt-10 p-4">
      <h1 className="text-2xl font-bold mb-6">System Installation</h1>

      {step === 1 && (
        <div className="space-y-4">
          <div>
            <Label>Full Name</Label>
            <Input
              name="fullName"
              value={form.fullName}
              onChange={handleChange}
            />
          </div>
          <div>
            <Label>Email</Label>
            <Input name="email" value={form.email} onChange={handleChange} />
          </div>
          <div>
            <Label>Username</Label>
            <Input
              name="username"
              value={form.username}
              onChange={handleChange}
            />
          </div>
          <div>
            <Label>Password</Label>
            <Input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
            />
          </div>
          <Button onClick={() => setStep(2)}>Next</Button>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <p>
            <strong>Full Name:</strong> {form.fullName}
          </p>
          <p>
            <strong>Email:</strong> {form.email}
          </p>
          <p>
            <strong>Username:</strong> {form.username}
          </p>
          <p>
            <strong>Password:</strong> *******
          </p>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setStep(1)}>
              Back
            </Button>
            <Button onClick={handleSubmit}>Submit</Button>
          </div>
        </div>
      )}
    </main>
  );
}
