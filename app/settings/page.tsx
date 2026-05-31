import { SettingsClient } from "@/components/SettingsClient";
import { requireUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  await requireUser();

  return <SettingsClient />;
}
