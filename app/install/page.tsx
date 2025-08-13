"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import Confetti from "react-confetti";

type FormData = {
  fullName: string;
  email: string;
  username: string;
  password: string;
  confirmPassword: string;
  role: string;
};

export default function InstallPage() {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormData>({
    fullName: "",
    email: "",
    username: "",
    password: "",
    confirmPassword: "",
    role: "super",
  });
  const [loading, setLoading] = useState(false);
  const [completed, setCompleted] = useState<boolean[]>([
    false,
    false,
    false,
    false,
  ]);

  // Validation messages
  const [emailValid, setEmailValid] = useState<string | null>(null);
  const [usernameValid, setUsernameValid] = useState<string | null>(null);
  const [passwordStrength, setPasswordStrength] = useState<
    "weak" | "medium" | "strong" | null
  >(null);
  const [confirmValid, setConfirmValid] = useState<string | null>(null);

  const steps = [
    {
      key: "fullName",
      label: "Full Name",
      placeholder: "John Doe",
      description:
        "Enter your full name as it appears on official documents. Example: John Michael Doe.",
    },
    {
      key: "email",
      label: "Email",
      placeholder: "john@example.com",
      description:
        "Provide an active email address. Notifications and password recovery will be sent here.",
      type: "email",
    },
    {
      key: "username",
      label: "Username",
      placeholder: "john_doe",
      description:
        "Choose a unique username (letters, numbers, underscores). Avoid spaces and special characters.",
    },
    {
      key: "password",
      label: "Password",
      placeholder: "••••••••",
      description:
        "Set a secure password (min 6 characters). Use letters, numbers, and symbols for strength.",
      type: "password",
    },
    {
      key: "confirmPassword",
      label: "Confirm Password",
      placeholder: "••••••••",
      description: "Re-enter your password to confirm it matches exactly.",
      type: "password",
    },
  ];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });

    // live validation
    if (name === "email") {
      const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      setEmailValid(regex.test(value) ? "Valid email ✅" : "Invalid email ❌");
    }

    if (name === "username") {
      if (value.length < 3) setUsernameValid("Too short ❌");
      else if (["admin", "test"].includes(value.toLowerCase()))
        setUsernameValid("Username taken ❌");
      else setUsernameValid("Username available ✅");
    }

    if (name === "password") {
      if (value.length < 6) setPasswordStrength("weak");
      else if (value.match(/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{6,}$/))
        setPasswordStrength("medium");
      else if (
        value.match(
          /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{6,}$/
        )
      )
        setPasswordStrength("strong");
      else setPasswordStrength("weak");
    }

    if (name === "confirmPassword") {
      setConfirmValid(
        value === form.password
          ? "Passwords match ✅"
          : "Passwords do not match ❌"
      );
    }
  };

  const validateStep = () => {
    const key = steps[step - 1].key as keyof FormData;
    const value = form[key];
    if (!value) {
      toast.error(`Please enter your ${steps[step - 1].label.toLowerCase()}`);
      return false;
    }
    if (key === "email" && emailValid !== "Valid email ✅") {
      toast.error("Please enter a valid email");
      return false;
    }
    if (key === "username" && usernameValid !== "Username available ✅") {
      toast.error("Please choose a valid username");
      return false;
    }
    if (key === "password" && passwordStrength === "weak") {
      toast.error("Password is too weak");
      return false;
    }
    if (key === "confirmPassword" && confirmValid !== "Passwords match ✅") {
      toast.error("Passwords do not match");
      return false;
    }
    return true;
  };

  const handleNext = () => {
    if (!validateStep()) return;
    const newCompleted = [...completed];
    newCompleted[step - 1] = true;
    setCompleted(newCompleted);
    setStep((prev) => prev + 1);
  };

  const handleBack = () => setStep((prev) => prev - 1);

  const handleSubmit = async () => {
    if (!validateStep()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/install", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success("Super user created! Redirecting...");
        setTimeout(() => (window.location.href = "/login"), 1500);
      } else {
        toast.error(data.message || "Failed to create super user");
      }
    } catch (err: any) {
      toast.error(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const progressPercent = Math.floor(((step - 1) / steps.length) * 100);

  const getPasswordColor = () => {
    if (passwordStrength === "weak") return "bg-red-500";
    if (passwordStrength === "medium") return "bg-yellow-400";
    if (passwordStrength === "strong") return "bg-green-500";
    return "bg-gray-200";
  };

  return (
    <main className="flex items-center justify-center min-h-screen bg-gradient-to-tr from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-950 p-4 relative">
      {step > steps.length && <Confetti />}
      <div className="w-full max-w-md">
        <AnimatePresence mode="wait">
          {step === 0 ? (
            <motion.div
              key="welcome"
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -50 }}
              transition={{ duration: 0.5 }}
              className="w-full bg-white dark:bg-gray-900 shadow-2xl rounded-3xl border border-gray-200 dark:border-gray-800 p-8 flex flex-col items-center justify-center space-y-6"
            >
              <h1 className="text-5xl font-extrabold text-blue-600 dark:text-blue-400 animate-bounce">
                PRTCMS
              </h1>
              <p className="text-gray-600 dark:text-gray-300 text-lg text-center">
                Manage research projects, teams, and tasks easily. Step-by-step
                setup ensures correct configuration.
              </p>
              <Button size="lg" onClick={() => setStep(1)}>
                Get Started
              </Button>
            </motion.div>
          ) : step <= steps.length ? (
            <motion.div
              key={`step-${step}`}
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -100 }}
              transition={{ duration: 0.5 }}
              className="w-full bg-white dark:bg-gray-900 shadow-2xl rounded-3xl border border-gray-200 dark:border-gray-800 p-8 space-y-6"
            >
              {/* Progress badge with checkmarks */}
              <div className="flex justify-center mb-4 space-x-2">
                {steps.map((s, index) => (
                  <span
                    key={index}
                    className={`px-3 py-1 rounded-full text-sm font-semibold ${
                      completed[index]
                        ? "bg-green-100 text-green-700"
                        : index + 1 === step
                        ? "bg-blue-100 text-blue-700"
                        : "bg-gray-200 text-gray-500"
                    }`}
                  >
                    {completed[index] ? "✔" : index + 1}
                  </span>
                ))}
              </div>

              {/* Step info */}
              <div className="space-y-2">
                <h2 className="text-2xl font-semibold text-gray-700 dark:text-gray-200">
                  {steps[step - 1].label}
                </h2>
                <p className="text-gray-500 dark:text-gray-400 text-sm">
                  {steps[step - 1].description}
                </p>
              </div>

              {/* Input field */}
              <Input
                type={(steps[step - 1].type as string) || "text"}
                name={steps[step - 1].key}
                placeholder={steps[step - 1].placeholder}
                value={form[steps[step - 1].key as keyof FormData]}
                onChange={handleChange}
                className="mt-2"
              />

              {/* Live validation messages */}
              <div className="text-sm mt-1 min-h-[1.25rem]">
                {steps[step - 1].key === "email" && emailValid && (
                  <span
                    className={`text-sm ${
                      emailValid.includes("✅")
                        ? "text-green-500"
                        : "text-red-500"
                    }`}
                  >
                    {emailValid}
                  </span>
                )}
                {steps[step - 1].key === "username" && usernameValid && (
                  <span
                    className={`text-sm ${
                      usernameValid.includes("✅")
                        ? "text-green-500"
                        : "text-red-500"
                    }`}
                  >
                    {usernameValid}
                  </span>
                )}
                {steps[step - 1].key === "password" && passwordStrength && (
                  <span
                    className={`text-sm ${getPasswordColor()} text-white px-2 py-1 rounded`}
                  >
                    {passwordStrength.toUpperCase()}
                  </span>
                )}
                {steps[step - 1].key === "confirmPassword" && confirmValid && (
                  <span
                    className={`text-sm ${
                      confirmValid.includes("✅")
                        ? "text-green-500"
                        : "text-red-500"
                    }`}
                  >
                    {confirmValid}
                  </span>
                )}
              </div>

              {/* Navigation buttons */}
              <div className="flex justify-between mt-6">
                {step > 1 && (
                  <Button variant="outline" onClick={handleBack}>
                    Back
                  </Button>
                )}
                {step < steps.length ? (
                  <Button onClick={handleNext}>Next</Button>
                ) : (
                  <Button onClick={handleSubmit} disabled={loading}>
                    {loading ? "Creating..." : "Submit"}
                  </Button>
                )}
              </div>

              {/* Progress bar */}
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-6">
                <div
                  className="bg-blue-600 dark:bg-blue-400 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${progressPercent}%` }}
                ></div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="done"
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -50 }}
              transition={{ duration: 0.5 }}
              className="w-full bg-white dark:bg-gray-900 shadow-2xl rounded-3xl border border-gray-200 dark:border-gray-800 p-8 flex flex-col items-center justify-center space-y-4"
            >
              <Confetti />
              <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
                All done!
              </h1>
              <p className="text-gray-600 dark:text-gray-300 text-center">
                Your super user has been created successfully. Redirecting...
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}
