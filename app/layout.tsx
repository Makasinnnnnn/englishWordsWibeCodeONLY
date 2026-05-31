import type { Metadata } from "next";
import type { ReactNode } from "react";

import "@/app/globals.css";
import { Layout } from "@/components/Layout";
import { ToastProvider } from "@/components/Toast";
import { getCurrentUser } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Word Memory Trainer",
  description: "Личный тренажер английских слов с ассоциациями, картинками и лестницей подсказок."
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  const user = await getCurrentUser();

  return (
    <html lang="ru">
      <body>
        <ToastProvider>
          <Layout user={user}>{children}</Layout>
        </ToastProvider>
      </body>
    </html>
  );
}
