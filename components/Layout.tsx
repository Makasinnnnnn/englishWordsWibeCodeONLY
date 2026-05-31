import type { ReactNode } from "react";

import { Header } from "@/components/Header";
import { Sidebar } from "@/components/Sidebar";
import type { AuthUser } from "@/lib/auth";

export function Layout({ children, user }: { children: ReactNode; user: AuthUser | null }) {
  return (
    <div className="flex min-h-screen">
      <Sidebar user={user} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Header user={user} />
        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 md:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
