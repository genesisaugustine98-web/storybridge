import { CLASS_LEVELS, DURATIONS, MATERIALS } from '@/lib/studioData';
import AnchorEditor from '@/components/studio/AnchorEditor';
import { cn } from '@/lib/utils';
import { Textarea } from '@/components/ui/textarea';
import { ArrowRight, Loader2, Wand2 } from 'lucide-react';

const chip = (active) =>
  cn(
    'rounded-full border px-3 py-1.5 text-[12.5px] transition-all duration-200',
    active
      ? 'border-primary bg-primary text-primary-foreground shadow-sm'
      : 'border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground'
  );

function Field({ label, hint, children }) {
  return (
    <div className="grid gap-2.5 py-5 first:pt-0 last:pb-0 sm:grid-cols-[132px_minmax(0,1fr)] sm:gap-6">
      <div>
        <p className="text-[12.5px] font-medium text-foreground">{label}</p>
        {hint ? <p className="mt-1 text-[11.5px] leading-snug text-muted-foreground">{hint}</p> : null}
      </div>
      <div className="min-w-0">{children}</div>
    </div>
  );
}

export default function BriefForm({ brief, onChange, onLoadExample, onSubmit, busy = false }) {
  const set = (patch) => onChange({ ...brief, ...patch });
  const toggleMaterial = (m) =>
    set({
      materials: brief.materials.includes(m)
        ? brief.materials.filter((x) => x !== m)
        : [...brief.materials, m],
    });

  // Short topics such as "noun" are valid inputs; the form asks for a topic,
  // not a minimum-length essay. Only an empty objective should block submission.
  const ready = brief.objective.trim().length > 0;

  return (
    <div className="card-soft overflow-hidden">
      <div className="divide-y divide-border/60 px-5 py-5 sm:px-7">
        <Field label="Class level" hint="Nigerian secondary school">
          <div className="flex flex-wrap gap-1.5">
            {CLASS_LEVELS.map((level) => (
              <button
                key={level}
                type="button"
                onClick={() => set({ classLevel: level })}
                className={chip(brief.classLevel === level)}
              >
                {level}
              </button>
            ))}
          </div>
        </Field>

        <Field label="Objective or topic" hint="Short topics such as “noun” are accepted; a learning action makes the lesson more focused.">
          <Textarea
            value={brief.objective}
            onChange={(e) => set({ objective: e.target.value })}
            placeholder="e.g. Persuasive language in public-service messages"
            rows={3}
            className="resize-none bg-card text-[14.5px] leading-relaxed"
          />
        </Field>

        <Field label="Lesson duration" hint="Single period">
          <div className="flex flex-wrap gap-1.5">
            {DURATIONS.map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => set({ duration: d })}
                className={chip(brief.duration === d)}
              >
                {d} min
              </button>
            ))}
          </div>
        </Field>

        <Field label="Available materials" hint="We only plan with what you actually have">
          <div className="flex flex-wrap gap-1.5">
            {MATERIALS.map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => toggleMaterial(m)}
                className={chip(brief.materials.includes(m))}
              >
                {m}
              </button>
            ))}
          </div>
        </Field>

        <Field
          label="Cultural anchors"
          hint="Optional. Enter a film, book, artist, genre, sport or place, choose its kind, then press Add. Only added references are sent to Qloo."
        >
          <AnchorEditor anchors={brief.anchors} onChange={(anchors) => set({ anchors })} />
        </Field>
      </div>

      <div className="flex flex-col gap-3 border-t border-border/70 bg-secondary/40 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-7">
        <button
          type="button"
          onClick={onLoadExample}
          className="inline-flex items-center gap-1.5 text-[12.5px] text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
        >
          <Wand2 className="h-3.5 w-3.5" />
          Load the example run
        </button>
        <button
          type="button"
          onClick={onSubmit}
          disabled={!ready || busy}
          className={cn(
            'inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-[13.5px] font-medium transition-all',
            ready && !busy
              ? 'bg-primary text-primary-foreground hover:opacity-92'
              : 'cursor-not-allowed bg-muted text-muted-foreground'
          )}
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {busy ? 'Checking Qloo…' : 'Check cultural evidence'}
          {!busy ? <ArrowRight className="h-4 w-4" /> : null}
        </button>
      </div>
    </div>
  );
}