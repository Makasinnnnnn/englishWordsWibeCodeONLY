import type { Metadata } from "next";
import type { ReactNode } from "react";

import "@/app/globals.css";
import { Layout } from "@/components/Layout";
import { ToastProvider } from "@/components/Toast";

export const metadata: Metadata = {
  title: "Word Memory Trainer",
  description: "Личный тренажер английских слов с ассоциациями, картинками и лестницей подсказок."
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ru">
      <body>
        <ToastProvider>
          <Layout>{children}</Layout>
        </ToastProvider>
      </body>
    </html>
  );
}
