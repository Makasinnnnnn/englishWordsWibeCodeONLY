import { cn } from "@/utils/cn";

type HintStepProgressProps = {
  currentStep: number;
  totalSteps: number;
};

export function HintStepProgress({ currentStep, totalSteps }: HintStepProgressProps) {
  return (
    <div className="flex items-center gap-2" aria-label={`Этап ${currentStep} из ${totalSteps}`}>
      {Array.from({ length: totalSteps }, (_, index) => {
        const step = index + 1;
        const isActive = step === currentStep;
        const isDone = step < currentStep;

        return (
          <div
            key={step}
            className={cn(
              "h-2 flex-1 rounded-full transition",
              isActive && "bg-sky-300",
              isDone && "bg-emerald-400",
              !isActive && !isDone && "bg-white/10"
            )}
          />
        );
      })}
    </div>
  );
}
