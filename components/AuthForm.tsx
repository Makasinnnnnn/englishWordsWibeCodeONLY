"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { LogIn, UserPlus } from "lucide-react";

import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { useToast } from "@/components/Toast";
import { authSchema } from "@/lib/authSchemas";

type AuthFormProps = {
  mode: "login" | "register";
};

export function AuthForm({ mode }: AuthFormProps) {
  const { showToast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const isRegister = mode === "register";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrors({});

    const parsed = authSchema.safeParse({ email, password });
    if (!parsed.success) {
      const fieldErrors = parsed.error.flatten().fieldErrors;
      setErrors(Object.fromEntries(Object.entries(fieldErrors).map(([key, value]) => [key, value?.[0] ?? "Invalid value"])));
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch(`/api/auth/${mode}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(parsed.data)
      });
      const data = (await response.json()) as { error?: string; code?: string };

      if (!response.ok) {
        throw new Error(data.error || "Auth failed");
      }

      showToast(isRegister ? "Account created" : "Logged in", "success");
      window.location.assign("/");
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Auth failed", "error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="panel mx-auto max-w-md space-y-5 p-6" onSubmit={handleSubmit}>
      <div>
        <p className="text-xs uppercase tracking-[0.18em] text-sky-200/80">Word Memory Trainer</p>
        <h2 className="mt-2 text-2xl font-semibold text-white">{isRegister ? "Create account" : "Log in"}</h2>
        <p className="mt-2 text-sm leading-6 text-slate-400">
          {isRegister ? "Your words, associations, images, and progress will be visible only to you." : "Open your private dictionary and training progress."}
        </p>
      </div>

      <Input label="Email" name="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} error={errors.email} required />
      <Input label="Password" name="password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} error={errors.password} required />

      <Button type="submit" variant="primary" className="w-full justify-center" icon={isRegister ? <UserPlus className="h-4 w-4" /> : <LogIn className="h-4 w-4" />} disabled={submitting}>
        {submitting ? "Please wait..." : isRegister ? "Create account" : "Log in"}
      </Button>

      <p className="text-center text-sm text-slate-400">
        {isRegister ? "Already have an account?" : "No account yet?"}{" "}
        <Link href={isRegister ? "/login" : "/register"} className="text-sky-200 hover:text-sky-100">
          {isRegister ? "Log in" : "Create one"}
        </Link>
      </p>
    </form>
  );
}
