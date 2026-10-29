import ExamplesUsed from '@/components/lesson/ExamplesUsed';
import { mins } from '@/lib/lessonFormat';
import { cn } from '@/lib/utils';
import { AlertTriangle, Check, ShieldCheck } from 'lucide-react';

export default function LessonHeader({ lesson, brief, mode, validation, draftLabel }) {
  return (
    <div className="space-y-4">
      <div className="card-soft p-5 sm:p-6">
        <div className="flex flex-wrap items-center gap-2">
          <span className="label-caps">Step three · Lesson draft</span>
          <span
            className={cn(
              'rounded-full border px-2 py-0.5 text-[10.5px] font-medium',
              mode === 'demo'
                ? 'border-accent/35 bg-accent/10 text-accent'
                : 'border-primary/25 bg-primary/10 text-primary'
            )}
          >
            {draftLabel}
          </span>
        </div>

        <h2 className="mt-2 font-heading text-[26px] leading-tight sm:text-[30px]">{lesson.lessonTitle}</h2>

        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[12.5px] text-muted-foreground">
          <span>{brief.classLevel}</span>
          <span aria-hidden>·</span>
          <span>{brief.objective}</span>
          <span aria-hidden>·</span>
          <span className="tnum">{mins(brief.duration)}</span>
        </div>

        {lesson.outcomes && lesson.outcomes.length ? (
          <ul className="mt-4 grid gap-1.5 border-t border-border/60 pt-3">
            {lesson.outcomes.map((outcome) => (
              <li key={outcome} className="flex gap-2 text-[12.5px] leading-relaxed text-foreground/80">
                <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                {outcome}
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      <div className="flex items-start gap-3 rounded-xl border border-accent/35 bg-accent/8 px-4 py-3">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
        <p className="text-[12.5px] leading-relaxed text-foreground/85">
          <span className="font-medium">Review before you teach this.</span> Every suggestion here is a draft. Check
          the language level, the suitability of each example for your class, and every fact before use.
          {mode === 'demo'
            ? ' This draft is in demo mode: examples are your own references and no Qloo score is involved.'
            : ' Affinity shows what audiences who share your anchors tend to also like — not what your pupils will enjoy or learn from.'}
        </p>
      </div>

      {validation && validation.removed && validation.removed.length ? (
        <div className="flex items-start gap-3 rounded-xl border border-border bg-card px-4 py-3">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
          <p className="text-[12px] leading-relaxed text-muted-foreground">
            {validation.note} Removed: {validation.removed.join(', ')}.
          </p>
        </div>
      ) : null}

      <section>
        <p className="label-caps mb-2">Examples used in this draft</p>
        <ExamplesUsed examples={lesson.examples} />
      </section>
    </div>
  );
}