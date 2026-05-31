"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";

import { Button } from "@/components/Button";

export function LogoutButton() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  async function logout() {
    setSubmitting(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  }

  return <Button type="button" variant="ghost" size="sm" icon={<LogOut className="h-4 w-4" />} onClick={() => void logout()} disabled={submitting}>Log out</Button>;
}
