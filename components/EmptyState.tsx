import Link from "next/link";
import { PlusCircle } from "lucide-react";

import { Button } from "@/components/Button";

type EmptyStateProps = {
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
};

export function EmptyState({ title, description, actionLabel, actionHref }: EmptyStateProps) {
  return (
    <div className="panel flex min-h-72 flex-col items-center justify-center px-6 py-12 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-lg border border-sky-300/20 bg-sky-400/10 text-sky-200">
        <PlusCircle className="h-7 w-7" />
      </div>
      <h2 className="text-xl font-semibold text-white">{title}</h2>
      <p className="mt-2 max-w-lg text-sm leading-6 text-slate-400">{description}</p>
      {actionLabel && actionHref ? (
        <Link href={actionHref} className="mt-6">
          <Button variant="primary" icon={<PlusCircle className="h-4 w-4" />}>
            {actionLabel}
          </Button>
        </Link>
      ) : null}
    </div>
  );
}
