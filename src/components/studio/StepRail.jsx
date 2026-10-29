import { STEPS } from '@/lib/studioData';
import { cn } from '@/lib/utils';

export default function StepRail({ current = 1, maxStep = 1, onSelect }) {
  return (
    <nav aria-label="Workflow" className="min-w-0 max-w-full lg:sticky lg:top-24">
      <p className="label-caps mb-4 hidden lg:block">Workflow</p>
      <ol className="flex w-full gap-2 overflow-x-auto pb-2 lg:flex-col lg:gap-0 lg:overflow-visible lg:pb-0">
        {STEPS.map((step, index) => {
          const active = step.id === current;
          const done = step.id < current;
          const reachable = step.id <= maxStep && typeof onSelect === 'function';

          return (
            <li
              key={step.id}
              className={cn(
                'relative min-w-[150px] shrink-0 rounded-xl transition-colors lg:min-w-0 lg:rounded-none',
                index < STEPS.length - 1 && 'lg:border-b lg:border-border/60',
                active && 'bg-secondary/70 lg:bg-transparent'
              )}
            >
              <button
                type="button"
                onClick={() => reachable && onSelect(step.id)}
                disabled={!reachable}
                className={cn(
                  'flex w-full items-start gap-3 px-3 py-3 text-left lg:px-0 lg:py-3.5',
                  reachable && !active && 'cursor-pointer hover:opacity-80',
                  !reachable && 'cursor-default'
                )}
              >
                <span
                  className={cn(
                    'mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full border text-[11px] tnum transition-colors',
                    active && 'border-primary bg-primary text-primary-foreground',
                    done && 'border-primary/40 bg-primary/10 text-primary',
                    !active && !done && 'border-border text-muted-foreground'
                  )}
                >
                  {String(step.id).padStart(2, '0')}
                </span>
                <span className="min-w-0">
                  <span
                    className={cn(
                      'block text-[13.5px] font-medium leading-tight',
                      active ? 'text-foreground' : 'text-muted-foreground'
                    )}
                  >
                    {step.label}
                  </span>
                  <span className="mt-0.5 hidden text-[11.5px] leading-snug text-muted-foreground/80 lg:block">
                    {step.hint}
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}