"use client";

import { useState } from "react";
import Link from "next/link";
import { MailCheck, RefreshCw } from "lucide-react";

import { Button } from "@/components/Button";
import { useToast } from "@/components/Toast";
import type { AuthUser } from "@/lib/auth";

type EmailVerificationBannerProps = {
  user: AuthUser | null;
};

type ResendResponse = {
  ok: boolean;
  error?: {
    message: string;
  };
};

export function EmailVerificationBanner({ user }: EmailVerificationBannerProps) {
  const { showToast } = useToast();
  const [sending, setSending] = useState(false);

  if (!user?.email || user.emailVerifiedAt) {
    return null;
  }

  async function resendVerification() {
    try {
      setSending(true);
      const response = await fetch("/api/auth/resend-verification", {
        method: "POST"
      });
      const data = (await response.json()) as ResendResponse;

      if (!response.ok || !data.ok) {
        throw new Error(data.error?.message ?? "Не удалось отправить письмо");
      }

      showToast("Если email ожидает подтверждения, мы отправили новую ссылку.", "success");
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Не удалось отправить письмо", "error");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="border-b border-amber-300/20 bg-amber-400/[0.08] px-4 py-3 md:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-amber-300/20 bg-amber-400/10 text-amber-100">
            <MailCheck className="h-4 w-4" />
          </div>
          <div>
            <p className="text-sm font-medium text-white">Подтвердите email</p>
            <p className="mt-1 text-xs leading-5 text-slate-400">
              Мы отправили ссылку на <span className="break-all text-slate-200">{user.email}</span>. Без подтверждения
              аккаунт всё равно работает, но восстановление доступа будет надежнее.
            </p>
          </div>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <Button
            type="button"
            variant="warning"
            size="sm"
            icon={sending ? <RefreshCw className="h-4 w-4 animate-spin" /> : <MailCheck className="h-4 w-4" />}
            disabled={sending}
            onClick={() => void resendVerification()}
          >
            Отправить снова
          </Button>
          <Link href="/settings/account">
            <Button type="button" variant="secondary" size="sm">
              Аккаунт
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
