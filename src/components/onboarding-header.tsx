import { cn } from "@/lib/utils";

const STEPS = ["Profile", "Activities", "Quiz", "Reveal"];

export function OnboardingHeader({ step }: { step: number }) {
  return (
    <div className="flex items-center gap-2" aria-label={`Step ${step} of ${STEPS.length}: ${STEPS[step - 1]}`}>
      {STEPS.map((label, i) => {
        const n = i + 1;
        const done = n < step;
        const active = n === step;
        return (
          <div key={label} className="flex flex-1 flex-col gap-1.5">
            <div
              className={cn(
                "h-1.5 rounded-full transition-colors",
                done ? "grad-lime" : active ? "grad-hot" : "bg-white/15",
              )}
            />
            <div className={cn("text-[10px] font-bold uppercase tracking-wider", active ? "text-white" : "text-muted-foreground")}>
              {label}
            </div>
          </div>
        );
      })}
    </div>
  );
}
