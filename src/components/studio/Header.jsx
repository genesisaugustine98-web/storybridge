import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

const STATUS = {
  checking: { label: 'Checking Qloo', dot: 'bg-muted-foreground', tone: 'border-border bg-muted/60 text-muted-foreground' },
  ready: { label: 'Qloo key found', dot: 'bg-emerald-600', tone: 'border-emerald-700/25 bg-emerald-50/70 text-emerald-900' },
  live: { label: 'Qloo live', dot: 'bg-emerald-600', tone: 'border-emerald-700/25 bg-emerald-50/70 text-emerald-900' },
  setup: { label: 'Qloo setup needed', dot: 'bg-accent', tone: 'border-accent/35 bg-accent/10 text-accent' },
  'no-matches': { label: 'No Qloo matches', dot: 'bg-accent', tone: 'border-accent/35 bg-accent/10 text-accent' },
  unavailable: { label: 'Qloo unavailable', dot: 'bg-destructive', tone: 'border-destructive/30 bg-destructive/10 text-destructive' },
  demo: { label: 'Demo mode', dot: 'bg-accent', tone: 'border-accent/35 bg-accent/10 text-accent' },
};

export default function Header({ status }) {
  const pill = status ? STATUS[status] || STATUS.checking : null;

  return (
    <header className="sticky top-0 z-30 border-b border-border/70 bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-5 py-3.5 sm:px-8">
        <Link to="/" className="group flex items-center gap-3">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary text-primary-foreground">
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.6">
              <path d="M3 18h18" strokeLinecap="round" />
              <path d="M5 18c0-4.5 3.1-8 7-8s7 3.5 7 8" strokeLinecap="round" />
              <path d="M12 10V5" strokeLinecap="round" />
            </svg>
          </span>
          <span className="leading-tight">
            <span className="block font-heading text-[19px] tracking-tight">StoryBridge</span>
            <span className="hidden text-[10.5px] uppercase tracking-[0.18em] text-muted-foreground sm:block">
              Curriculum to culture
            </span>
          </span>
        </Link>

        <div className="flex items-center gap-3">
          {pill ? (
            <span className={cn('inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[11.5px] font-medium', pill.tone)}>
              <span className={cn('h-1.5 w-1.5 rounded-full', pill.dot)} />
              {pill.label}
            </span>
          ) : null}
          <Link
            to="/methodology"
            className="hidden text-[12.5px] text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline sm:block"
          >
            Methodology
          </Link>
        </div>
      </div>
    </header>
  );
}