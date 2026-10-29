import { pct, shortId } from '@/lib/lessonFormat';
import { cn } from '@/lib/utils';
import { Database, GraduationCap, UserRound } from 'lucide-react';

const SOURCE = {
  qloo: { label: 'Qloo result', className: 'border-primary/25 bg-primary/10 text-primary', Icon: Database },
  teacher: { label: 'Teacher-specified', className: 'border-accent/30 bg-accent/10 text-accent', Icon: UserRound },
  curriculum: { label: 'Curriculum only', className: 'border-border bg-muted text-muted-foreground', Icon: GraduationCap },
};

export default function ExamplesUsed({ examples = [] }) {
  if (!examples.length) {
    return (
      <div className="rounded-xl border border-dashed border-border px-4 py-3 text-[12.5px] text-muted-foreground">
        This draft cites no cultural example. Nothing was invented to fill the gap.
      </div>
    );
  }

  return (
    <ul className="grid gap-3 sm:grid-cols-2">
      {examples.map((example) => {
        const source = SOURCE[example.source] || SOURCE.curriculum;
        const Icon = source.Icon;
        return (
          <li key={`${example.name}-${example.source}`} className="rounded-xl border border-border/80 bg-card p-4">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="font-heading text-[15.5px] leading-tight">{example.name}</p>
                <p className="mt-0.5 text-[10.5px] uppercase tracking-[0.14em] text-muted-foreground">{example.kind}</p>
              </div>
              <span className={cn('inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium', source.className)}>
                <Icon className="h-2.5 w-2.5" />
                {source.label}
              </span>
            </div>

            {example.useInLesson ? (
              <p className="mt-2 text-[12.5px] leading-relaxed text-foreground/80">{example.useInLesson}</p>
            ) : null}

            {example.source === 'qloo' ? (
              <div className="mt-2.5 space-y-0.5 border-t border-border/60 pt-2 text-[11px] text-muted-foreground">
                <p className="tnum">
                  Qloo affinity {pct(example.affinity)}
                  {example.entityId ? <span className="ml-1.5 font-mono text-[10px] opacity-70">{shortId(example.entityId)}</span> : null}
                </p>
                {example.drivers && example.drivers.length ? (
                  <p>
                    Linked to{' '}
                    {example.drivers
                      .map((d) => `${d.seed}${typeof d.score === 'number' ? ` (${d.score.toFixed(2)})` : ''}`)
                      .join(', ')}
                  </p>
                ) : null}
              </div>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}