"use client";

import { useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import { Copy, Eye, EyeOff, KeyRound, LogIn, RefreshCw, ShieldCheck, UserPlus } from "lucide-react";

import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { useToast } from "@/components/Toast";
import { authSchema } from "@/lib/authSchemas";

type AuthFormProps = {
  mode: "login" | "register";
};

type GeneratedCredentials = {
  login: string;
  password: string;
};

const alphabet = "abcdefghjkmnpqrstuvwxyz23456789";

function randomString(length: number) {
  const values = new Uint32Array(length);
  window.crypto.getRandomValues(values);

  return Array.from(values, (value) => alphabet[value % alphabet.length]).join("");
}

function generateCredentials(): GeneratedCredentials {
  return {
    login: `user-${randomString(8)}`,
    password: `${randomString(5)}-${randomString(5)}-${randomString(5)}`
  };
}

export function AuthForm({ mode }: AuthFormProps) {
  const { showToast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [generatedCredentials, setGeneratedCredentials] = useState<GeneratedCredentials | null>(null);
  const isRegister = mode === "register";
  const passwordLengthError = password.length > 0 && password.length < 8 ? `Пароль меньше 8 символов. Нужно ещё ${8 - password.length}.` : undefined;
  const passwordHint = useMemo(() => {
    if (passwordLengthError) {
      return undefined;
    }

    return isRegister ? "Минимум 8 символов. Для случайного аккаунта лучше сразу сохранить пароль." : undefined;
  }, [isRegister, passwordLengthError]);

  function fillRandomCredentials() {
    const nextCredentials = generateCredentials();
    setEmail(nextCredentials.login);
    setPassword(nextCredentials.password);
    setShowPassword(true);
    setErrors({});
    setGeneratedCredentials(nextCredentials);
  }

  async function copyGeneratedCredentials() {
    if (!generatedCredentials) {
      return;
    }

    await navigator.clipboard.writeText(`Логин: ${generatedCredentials.login}\nПароль: ${generatedCredentials.password}`);
    showToast("Логин и пароль скопированы", "success");
  }

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

      showToast(isRegister ? "Аккаунт создан" : "Вход выполнен", "success");
      window.location.assign("/");
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Не удалось войти", "error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="panel mx-auto max-w-md space-y-5 p-6 shadow-2xl shadow-sky-950/20" onSubmit={handleSubmit}>
      <div>
        <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-sky-300/20 bg-sky-400/15 text-sky-100">
          {isRegister ? <UserPlus className="h-5 w-5" /> : <LogIn className="h-5 w-5" />}
        </div>
        <p className="mt-4 text-xs uppercase tracking-[0.18em] text-sky-200/80">Word Memory Trainer</p>
        <h2 className="mt-2 text-2xl font-semibold text-white">{isRegister ? "Создать приватный аккаунт" : "Войти в словарь"}</h2>
        <p className="mt-2 text-sm leading-6 text-slate-400">
          {isRegister ? "Слова, ассоциации, картинки и прогресс будут привязаны только к этому аккаунту." : "Введи email или случайный логин, который был создан при регистрации."}
        </p>
      </div>

      {isRegister ? (
        <div className="rounded-lg border border-amber-300/20 bg-amber-300/10 p-4">
          <div className="flex items-start gap-3">
            <KeyRound className="mt-0.5 h-5 w-5 shrink-0 text-amber-100" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-amber-50">Одноразовый логин без почты</p>
              <p className="mt-1 text-xs leading-5 text-amber-100/75">Можно создать случайный логин и пароль. Если потеряешь пароль, восстановить такой аккаунт не получится.</p>
              <Button type="button" variant="warning" size="sm" className="mt-3" icon={<RefreshCw className="h-4 w-4" />} onClick={fillRandomCredentials}>
                Сгенерировать логин и пароль
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      {generatedCredentials ? (
        <div className="rounded-lg border border-emerald-300/20 bg-emerald-400/10 p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-medium text-emerald-50">Сохрани эти данные сейчас</p>
              <p className="mt-2 break-all text-sm text-slate-200">Логин: {generatedCredentials.login}</p>
              <p className="mt-1 break-all text-sm text-slate-200">Пароль: {generatedCredentials.password}</p>
            </div>
            <Button type="button" variant="success" size="icon" aria-label="Скопировать логин и пароль" icon={<Copy className="h-4 w-4" />} onClick={() => void copyGeneratedCredentials()} />
          </div>
        </div>
      ) : null}

      <Input
        label="Email или логин"
        name="email"
        type="text"
        autoComplete="username"
        value={email}
        onChange={(event) => {
          setEmail(event.target.value);
          setGeneratedCredentials(null);
        }}
        placeholder={isRegister ? "you@example.com или user-name" : "email или логин"}
        error={errors.email}
        hint={isRegister ? "Настоящий email пригодится, если позже добавим восстановление пароля." : undefined}
        required
      />

      <Input
        label="Пароль"
        name="password"
        type={showPassword ? "text" : "password"}
        autoComplete={isRegister ? "new-password" : "current-password"}
        value={password}
        onChange={(event) => {
          setPassword(event.target.value);
          setGeneratedCredentials(null);
        }}
        error={errors.password || passwordLengthError}
        hint={passwordHint}
        rightElement={
          <button
            type="button"
            className="focus-ring rounded-md p-2 text-slate-400 transition hover:bg-white/10 hover:text-white"
            aria-label={showPassword ? "Скрыть пароль" : "Показать пароль"}
            onClick={() => setShowPassword((current) => !current)}
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        }
        required
      />

      <Button type="submit" variant="primary" className="w-full justify-center" icon={isRegister ? <ShieldCheck className="h-4 w-4" /> : <LogIn className="h-4 w-4" />} disabled={submitting}>
        {submitting ? "Проверяю..." : isRegister ? "Создать аккаунт" : "Войти"}
      </Button>

      <p className="text-center text-sm text-slate-400">
        {isRegister ? "Уже есть аккаунт?" : "Ещё нет аккаунта?"}{" "}
        <Link href={isRegister ? "/login" : "/register"} className="text-sky-200 hover:text-sky-100">
          {isRegister ? "Войти" : "Создать"}
        </Link>
      </p>
    </form>
  );
}
