import { cn } from "@/utils/cn";

type ProgressBarProps = {
  value: number;
  max?: number;
  label?: string;
  tone?: "sky" | "emerald" | "amber";
};

const tones = {
  sky: "from-sky-400 to-blue-500",
  emerald: "from-emerald-400 to-teal-500",
  amber: "from-amber-300 to-orange-500"
};

export function ProgressBar({ value, max = 100, label, tone = "sky" }: ProgressBarProps) {
  const percent = Math.min(100, Math.max(0, (value / max) * 100));

  return (
    <div className="space-y-2">
      {label ? (
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span>{label}</span>
          <span>{Math.round(percent)}%</span>
        </div>
      ) : null}
      <div className="h-2 overflow-hidden rounded-full bg-white/10" role="progressbar" aria-valuenow={value} aria-valuemax={max}>
        <div className={cn("h-full rounded-full bg-gradient-to-r transition-all", tones[tone])} style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}
