import { redirect } from "next/navigation";

import { AuthForm } from "@/components/AuthForm";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function RegisterPage() {
  const user = await getCurrentUser();

  if (user) {
    redirect("/");
  }

  return (
    <AuthForm
      mode="register"
      telegramBotUsername={process.env.TELEGRAM_BOT_USERNAME}
      isDevelopment={process.env.NODE_ENV !== "production"}
    />
  );
}
