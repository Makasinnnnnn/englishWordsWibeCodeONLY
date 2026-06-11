import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";

import "@/app/globals.css";
import { Layout } from "@/components/Layout";
import { InstallPrompt } from "@/components/pwa/InstallPrompt";
import { ServiceWorkerRegister } from "@/components/pwa/ServiceWorkerRegister";
import { ToastProvider } from "@/components/Toast";
import { getCurrentUser } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Word Memory Trainer",
  description: "Личный тренажер английских слов с ассоциациями, картинками и лестницей подсказок.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Words"
  },
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" }
    ],
    apple: [{ url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" }]
  }
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f8fafc" },
    { media: "(prefers-color-scheme: dark)", color: "#090b10" }
  ]
};

const themeScript = `
(() => {
  try {
    const preference = localStorage.getItem("word-memory-theme") || "system";
    const systemLight = window.matchMedia("(prefers-color-scheme: light)").matches;
    const theme = preference === "system" ? (systemLight ? "light" : "dark") : preference;
    document.documentElement.dataset.themePreference = preference;
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
  } catch {
    document.documentElement.dataset.theme = "dark";
  }
})();
`;

export default async function RootLayout({ children }: { children: ReactNode }) {
  const user = await getCurrentUser();

  return (
    <html lang="ru" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        <ToastProvider>
          <Layout user={user}>{children}</Layout>
          <InstallPrompt />
          <ServiceWorkerRegister />
        </ToastProvider>
      </body>
    </html>
  );
}
