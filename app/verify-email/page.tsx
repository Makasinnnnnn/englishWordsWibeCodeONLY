import Link from "next/link";
import { CheckCircle2, MailCheck, ShieldAlert } from "lucide-react";

import { Button } from "@/components/Button";
import { verifyEmailToken } from "@/lib/auth/email-verification";

export const dynamic = "force-dynamic";

type VerifyEmailPageProps = {
  searchParams?: {
    token?: string;
  };
};

function getMessage(code: "missing" | "invalid" | "expired" | "used" | "success") {
  if (code === "success") {
    return {
      icon: CheckCircle2,
      title: "Email подтверждён",
      description: "Теперь аккаунт выглядит надежнее, а восстановление доступа будет проще.",
      tone: "text-emerald-200 bg-emerald-400/10 border-emerald-300/20"
    };
  }

  if (code === "expired") {
    return {
      icon: ShieldAlert,
      title: "Ссылка устарела",
      description: "Войдите в аккаунт и отправьте письмо подтверждения повторно.",
      tone: "text-amber-200 bg-amber-400/10 border-amber-300/20"
    };
  }

  if (code === "used") {
    return {
      icon: MailCheck,
      title: "Ссылка уже использована",
      description: "Если email уже подтверждён, можно спокойно вернуться к словарю.",
      tone: "text-sky-200 bg-sky-400/10 border-sky-300/20"
    };
  }

  return {
    icon: ShieldAlert,
    title: "Не удалось подтвердить email",
    description: "Ссылка выглядит недействительной. Проверьте письмо или запросите новую ссылку.",
    tone: "text-red-200 bg-red-400/10 border-red-300/20"
  };
}

export default async function VerifyEmailPage({ searchParams }: VerifyEmailPageProps) {
  const token = searchParams?.token?.trim();
  let code: "missing" | "invalid" | "expired" | "used" | "success" = "missing";

  if (token) {
    const result = await verifyEmailToken(token);

    if (result.ok) {
      code = "success";
    } else if (result.code === "TOKEN_EXPIRED") {
      code = "expired";
    } else if (result.code === "TOKEN_USED") {
      code = "used";
    } else {
      code = "invalid";
    }
  }

  const message = getMessage(code);
  const Icon = message.icon;

  return (
    <div className="flex min-h-[70vh] items-center justify-center">
      <section className="panel w-full max-w-lg p-6 text-center sm:p-8">
        <div className={`mx-auto flex h-14 w-14 items-center justify-center rounded-lg border ${message.tone}`}>
          <Icon className="h-7 w-7" />
        </div>
        <p className="mt-5 text-xs uppercase tracking-[0.18em] text-sky-200/80">Word Memory Trainer</p>
        <h2 className="mt-2 text-2xl font-semibold text-white">{message.title}</h2>
        <p className="mt-3 text-sm leading-6 text-slate-400">{message.description}</p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link href="/">
            <Button variant="primary">Открыть словарь</Button>
          </Link>
          <Link href="/login">
            <Button variant="secondary">Войти</Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
