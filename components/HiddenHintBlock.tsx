import { EyeOff } from "lucide-react";

type HiddenHintBlockProps = {
  label: string;
};

export function HiddenHintBlock({ label }: HiddenHintBlockProps) {
  return (
    <div className="flex min-h-16 items-center justify-center rounded-lg border border-dashed border-white/10 bg-white/[0.03] px-4 text-sm text-slate-500 backdrop-blur">
      <EyeOff className="mr-2 h-4 w-4" />
      {label}
    </div>
  );
}
