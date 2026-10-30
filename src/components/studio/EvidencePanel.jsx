import { pct, shortId } from '@/lib/lessonFormat';
import { cn } from '@/lib/utils';
import { AlertTriangle, ArrowRight, Check, Database, Info, Loader2, RefreshCw, FlaskConical } from 'lucide-react';

function Notice({ tone = 'info', title, children }) {
  const tones = {
    info: 'border-border bg-card',
    warn: 'border-accent/35 bg-accent/8',
    bad: 'border-destructive/30 bg-destructive/8',
  };
  const Icon = tone === 'bad' ? AlertTriangle : tone === 'warn' ? FlaskConical : Info;
  return (
    <div className={cn('rounded-xl border p-4', tones[tone])}>
      <div className="flex items-start gap-3">
        <Icon className={cn('mt-0.5 h-4 w-4 shrink-0', tone === 'bad' ? 'text-destructive' : tone === 'warn' ? 'text-accent' : 'text-muted-foreground')} />
        <div className="min-w-0">
          <p className="text-[13px] font-medium text-foreground">{title}</p>
          <div className="mt-1 text-[12.5px] leading-relaxed text-muted-foreground">{children}</div>
        </div>
      </div>
    </div>
  );
}

function CallTrace({ calls }) {
  if (!calls || !calls.length) return null;
  const okCount = calls.filter((c) => c.ok).length;
  return (
    <details className="group rounded-xl border border-border/80 bg-card">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3">
        <span className="flex items-center gap-2 text-[12.5px] font-medium">
          <Database className="h-3.5 w-3.5 text-muted-foreground" />
          Qloo call trace
          <span className="text-muted-foreground">
            ({okCount}/{calls.length} succeeded)
          </span>
        </span>
        <span className="text-[11.5px] text-muted-foreground group-open:hidden">Show</span>
        <span className="hidden text-[11.5px] text-muted-foreground group-open:inline">Hide</span>
      </summary>
      <ul className="divide-y divide-border/60 border-t border-border/60">
        {calls.map((call, index) => (
          <li key={`${call.path}-${index}`} className="flex flex-wrap items-center gap-x-3 gap-y-1 px-4 py-2.5 text-[11.5px]">
            <span
              className={cn(
                'rounded px-1.5 py-0.5 font-mono text-[10.5px]',
                call.ok ? 'bg-emerald-100 text-emerald-900' : 'bg-destructive/10 text-destructive'
              )}
            >
              {call.status || 'ERR'}
            </span>
            <span className="font-mono text-foreground">{call.path}</span>
            <span className="min-w-0 flex-1 truncate text-muted-foreground">{call.summary}</span>
            <span className="tnum text-muted-foreground">{call.ms} ms</span>
            {!call.ok && call.message ? (
              <span className="w-full break-words font-mono text-[10.5px] leading-relaxed text-destructive">
                {call.message}
              </span>
            ) : null}
          </li>
        ))}
      </ul>
    </details>
  );
}

export default function EvidencePanel({ data, busy, onContinue, onDemo, onRetry, onBack }) {
  const mode = data?.mode;
  const live = mode === 'live';
  const demo = mode === 'demo';
  const curriculum = mode === 'curriculum';
  const broken = mode === 'setup' || mode === 'unavailable' || mode === 'no-matches';

  return (
    <div className="space-y-5">
      {live ? (
        <Notice tone="info" title={data.detail}>
          These values are copied straight from Qloo&apos;s response across {data.calls.length} server-side{' '}
          {data.calls.length === 1 ? 'call' : 'calls'}. Nothing here was written by the lesson model.
        </Notice>
      ) : null}

      {curriculum ? (
        <Notice tone="info" title="No cultural anchors added">
          <p>{data.detail}</p>
          <p className="mt-2">This will be a curriculum-only lesson. No Qloo searches, entities or affinity scores will be used.</p>
        </Notice>
      ) : null}

      {broken ? (
        <Notice tone={mode === 'unavailable' ? 'bad' : 'warn'} title={headlineFor(mode)}>
          <p>{data.detail}</p>
          {mode === 'setup' ? (
            <p className="mt-2">
              Add <code className="rounded bg-muted px-1 py-0.5 font-mono text-[11px]">QLOO_API_KEY</code> to the
              workspace secrets, then run the check again. The key is read on the server only and never reaches the
              browser.
            </p>
          ) : null}
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={onRetry}
              disabled={busy}
              className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-[12px] font-medium text-foreground transition-colors hover:border-primary/40"
            >
              <RefreshCw className="h-3.5 w-3.5" /> Run the Qloo check again
            </button>
            <button
              type="button"
              onClick={onDemo}
              disabled={busy}
              className="inline-flex items-center gap-1.5 rounded-full border border-accent/40 bg-accent/10 px-3 py-1.5 text-[12px] font-medium text-accent transition-colors hover:bg-accent/15"
            >
              <FlaskConical className="h-3.5 w-3.5" /> Use my references without Qloo
            </button>
          </div>
          <p className="mt-2 text-[11.5px]">
            This option uses only the references you typed. It shows no Qloo entities and no Qloo scores, and it never
            pretends a taste API endorsed your choices.
          </p>
        </Notice>
      ) : null}

      {demo ? (
        <Notice tone="warn" title="Teacher references — no Qloo recommendations">
          No Qloo recommendation was available for this run. The lesson will use only the anchors you entered, and
          every example will be labelled <em>teacher-specified</em>. No affinity scores will be shown.
        </Notice>
      ) : null}

      {data.anchors && data.anchors.length ? (
        <section className="card-soft overflow-hidden">
          <div className="border-b border-border/60 px-5 py-3.5">
            <p className="label-caps">Your anchors</p>
            <p className="mt-1 text-[12.5px] text-muted-foreground">
              {live
                ? 'Each anchor as Qloo resolved it. A result is accepted only if its name carries your wording; lookalikes are rejected and the anchor left empty.'
                : 'These are the references you chose. Nothing here came from Qloo.'}
            </p>
          </div>
          <ul className="divide-y divide-border/60">
            {data.anchors.map((anchor) => (
              <li key={anchor.label} className="flex flex-wrap items-center gap-x-3 gap-y-1 px-5 py-3">
                <span className="text-[13px] font-medium">{anchor.label}</span>
                <span className="rounded-full border border-border px-2 py-0.5 text-[10.5px] uppercase tracking-[0.12em] text-muted-foreground">
                  {anchor.kind}
                </span>
                {anchor.resolved ? (
                  <span className="flex flex-wrap items-center gap-1.5 text-[12px] text-muted-foreground">
                    <Check className="h-3 w-3 text-emerald-600" />
                    {anchor.resolved.name}
                    {anchor.resolved.tagId ? (
                      <span className="rounded-full border border-accent/35 bg-accent/10 px-1.5 py-0.5 text-[10px] uppercase tracking-[0.1em] text-accent">
                        genre tag
                      </span>
                    ) : null}
                    <span
                      className="font-mono text-[10.5px] text-muted-foreground/70"
                      title={anchor.resolved.tagId || anchor.resolved.entityId}
                    >
                      {anchor.resolved.tagId
                        ? String(anchor.resolved.tagId).replace(/^urn:tag:/, '')
                        : shortId(anchor.resolved.entityId)}
                    </span>
                  </span>
                ) : (
                  <span className="text-[12px] text-muted-foreground">{anchor.note || 'Not resolved'}</span>
                )}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {live && data.candidates.length ? (
        <section className="card-soft overflow-hidden">
          <div className="border-b border-border/60 px-5 py-3.5">
            <p className="label-caps">Candidate classroom examples</p>
            <p className="mt-1 text-[12.5px] text-muted-foreground">
              Ranked by Qloo affinity for audiences that share your anchors. The lesson may only cite from this list.
            </p>
          </div>
          <ol className="divide-y divide-border/60">
            {data.candidates.map((candidate) => (
              <li key={candidate.entityId} className="px-5 py-3.5">
                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <span className="font-heading text-[15.5px] leading-tight">{candidate.name}</span>
                  <span className="text-[11.5px] text-muted-foreground">{candidate.typeLabel}</span>
                  <span className="ml-auto rounded-full bg-primary px-2 py-0.5 text-[11px] font-medium tnum text-primary-foreground">
                    affinity {pct(candidate.affinity)}
                  </span>
                </div>
                <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11.5px] text-muted-foreground">
                  <span className="font-mono text-[10.5px] text-muted-foreground/70">{candidate.entityId}</span>
                  {candidate.drivers && candidate.drivers.length ? (
                    <span>
                      linked to{' '}
                      {candidate.drivers
                        .map((d) => `${d.seed}${typeof d.score === 'number' ? ` (${d.score.toFixed(2)})` : ''}`)
                        .join(', ')}
                    </span>
                  ) : null}
                </div>
              </li>
            ))}
          </ol>
        </section>
      ) : null}

      <CallTrace calls={data.calls} />

      {data.endpoints && data.endpoints.length ? (
        <p className="text-[11.5px] leading-relaxed text-muted-foreground">
          Endpoints used on hackathon.api.qloo.com:{' '}
          {data.endpoints.map((e) => `${e.method} ${e.path}`).join(' · ')}. The API key stays server-side.
        </p>
      ) : null}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <button
          type="button"
          onClick={onBack}
          className="text-[12.5px] text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
        >
          Edit the brief
        </button>
        <button
          type="button"
          onClick={onContinue}
          disabled={busy || (!live && !demo && !curriculum)}
          className={cn(
            'inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-[13.5px] font-medium transition-all',
            busy || (!live && !demo && !curriculum)
              ? 'cursor-not-allowed bg-muted text-muted-foreground'
              : 'bg-primary text-primary-foreground hover:opacity-92'
          )}
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {busy ? 'Drafting lesson…' : curriculum ? 'Build curriculum-only lesson' : demo ? 'Build lesson with my references' : 'Build the Qloo-informed lesson'}
          {!busy ? <ArrowRight className="h-4 w-4" /> : null}
        </button>
      </div>
    </div>
  );
}

function headlineFor(mode) {
  if (mode === 'setup') return 'Qloo is not connected yet';
  if (mode === 'no-matches') return 'Qloo returned no supported matches';
  return 'Qloo could not be reached';
}