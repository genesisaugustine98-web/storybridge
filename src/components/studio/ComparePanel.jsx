import { pct } from '@/lib/lessonFormat';
import { cn } from '@/lib/utils';
import { ArrowRight, AlertTriangle } from 'lucide-react';

function ExampleList({ examples, tone }) {
  return (
    <ul className="space-y-2">
      {examples && examples.length ? (
        examples.map((example) => (
          <li key={`${example.name}-${example.source}`} className="rounded-lg border border-border/70 bg-card px-3 py-2">
            <div className="flex flex-wrap items-baseline gap-x-2">
              <span className="text-[13px] font-medium">{example.name}</span>
              <span className="text-[10.5px] uppercase tracking-[0.12em] text-muted-foreground">{example.kind}</span>
            </div>
            {example.source === 'qloo' ? (
              <p className="mt-1 text-[11.5px] tnum text-accent">
                Qloo affinity {pct(example.affinity)}
                {example.drivers && example.drivers.length
                  ? ` · linked to ${example.drivers.map((d) => d.seed).join(', ')}`
                  : ''}
              </p>
            ) : (
              <p className={cn('mt-1 text-[11.5px]', tone === 'muted' ? 'text-muted-foreground' : 'text-muted-foreground')}>
                {example.source === 'teacher' ? 'Teacher-specified reference' : 'Curriculum-only example'}
              </p>
            )}
          </li>
        ))
      ) : (
        <li className="rounded-lg border border-dashed border-border px-3 py-2 text-[12px] text-muted-foreground">
          No examples in this draft.
        </li>
      )}
    </ul>
  );
}

export default function ComparePanel({ lesson, onBack }) {
  if (!lesson) return null;
  const { baseline, informed, comparison, mode } = lesson;

  return (
    <div className="space-y-6">
      <div className="card-soft p-5 sm:p-6">
        <p className="label-caps">What changed</p>
        <p className="mt-2 font-heading text-[19px] leading-snug text-foreground">
          {comparison.summary || 'No comparison summary was returned.'}
        </p>
        <p className="mt-3 text-[11.5px] text-muted-foreground">
          This summary is the model&apos;s own comparison of the two drafts — reasoning, not Qloo output.{' '}
          {mode === 'demo'
            ? 'Demo mode: no Qloo data or affinity numbers appear anywhere in this run.'
            : 'Affinity numbers shown below are copied from the Qloo results.'}
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="card-soft p-5">
          <div className="flex items-center justify-between gap-3">
            <p className="label-caps">Draft A · curriculum only</p>
            <span className="rounded-full border border-border px-2 py-0.5 text-[10.5px] text-muted-foreground">
              no cultural references
            </span>
          </div>
          <h3 className="mt-2 font-heading text-[17px] leading-snug">{baseline.lessonTitle}</h3>
          <div className="mt-3">
            <ExampleList examples={baseline.examples} tone="muted" />
          </div>
          <p className="mt-3 text-[12px] text-muted-foreground">
            Activity: {baseline.activity.title || '—'}
          </p>
        </section>

        <section className="card-soft border-primary/30 p-5">
          <div className="flex items-center justify-between gap-3">
            <p className="label-caps">{mode === 'demo' ? 'Draft B · teacher anchors' : 'Draft B · Qloo-informed'}</p>
            <span className="rounded-full border border-primary/25 bg-primary/10 px-2 py-0.5 text-[10.5px] text-primary">
              {mode === 'demo' ? 'demo mode' : 'grounded in live results'}
            </span>
          </div>
          <h3 className="mt-2 font-heading text-[17px] leading-snug">{informed.lessonTitle}</h3>
          <div className="mt-3">
            <ExampleList examples={informed.examples} />
          </div>
          <p className="mt-3 text-[12px] text-muted-foreground">
            Activity: {informed.activity.title || '—'}
          </p>
        </section>
      </div>

      {comparison.changes && comparison.changes.length ? (
        <section className="card-soft overflow-hidden">
          <div className="border-b border-border/60 px-5 py-3.5">
            <p className="label-caps">Side by side</p>
          </div>
          <ul className="divide-y divide-border/60">
            {comparison.changes.map((change) => (
              <li key={change.area} className="grid gap-2 px-5 py-4 sm:grid-cols-[140px_1fr_1fr] sm:gap-5">
                <p className="text-[12.5px] font-medium">{change.area}</p>
                <p className="text-[12.5px] leading-relaxed text-muted-foreground">{change.baseline}</p>
                <p className="text-[12.5px] leading-relaxed text-foreground">{change.informed}</p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {comparison.cautions && comparison.cautions.length ? (
        <section className="rounded-xl border border-accent/35 bg-accent/8 p-4">
          <p className="flex items-center gap-2 text-[12.5px] font-medium text-accent">
            <AlertTriangle className="h-3.5 w-3.5" /> Read before you teach the informed draft
          </p>
          <ul className="mt-2 space-y-1.5 text-[12.5px] leading-relaxed text-foreground/80">
            {comparison.cautions.map((caution) => (
              <li key={caution} className="flex gap-2">
                <span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-accent" />
                {caution}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <button
          type="button"
          onClick={onBack}
          className="text-[12.5px] text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
        >
          Back to the lesson
        </button>
        <p className="flex items-center gap-1.5 text-[11.5px] text-muted-foreground">
          Affinity is taste adjacency between audiences, not learning suitability.
          <ArrowRight className="h-3 w-3" />
        </p>
      </div>
    </div>
  );
}