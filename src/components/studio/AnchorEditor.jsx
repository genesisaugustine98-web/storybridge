import { useState } from 'react';
import { ANCHOR_KINDS } from '@/lib/studioData';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Plus, X } from 'lucide-react';

export default function AnchorEditor({ anchors = [], onChange }) {
  const [label, setLabel] = useState('');
  const [kind, setKind] = useState(ANCHOR_KINDS[0]);

  const add = () => {
    const value = label.trim();
    if (!value) return;
    if (anchors.some((a) => a.label.toLowerCase() === value.toLowerCase())) {
      setLabel('');
      return;
    }
    onChange([...anchors, { label: value, kind }]);
    setLabel('');
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row">
        <Input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              add();
            }
          }}
          placeholder="e.g. Nollywood drama, Fela Kuti, Afrobeats…"
          className="h-10 flex-1 bg-card"
          aria-label="Cultural anchor"
        />
        <div className="flex gap-2">
          <select
            value={kind}
            onChange={(e) => setKind(e.target.value)}
            aria-label="Anchor kind"
            className="h-10 rounded-md border border-input bg-card px-2.5 text-[13px] text-foreground focus:outline-none focus:ring-2 focus:ring-ring/30"
          >
            {ANCHOR_KINDS.map((k) => (
              <option key={k} value={k}>
                {k}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={add}
            className="inline-flex h-10 items-center gap-1.5 rounded-md border border-primary/25 bg-primary px-3 text-[13px] font-medium text-primary-foreground transition-opacity hover:opacity-90"
          >
            <Plus className="h-3.5 w-3.5" /> Add
          </button>
        </div>
      </div>

      {anchors.length === 0 ? (
        <p className="text-[12.5px] leading-relaxed text-muted-foreground">
          None yet. Anchors are optional — they tell Qloo which part of your students&apos; cultural world
          to look at. Use only things you have chosen yourself, never a pupil&apos;s profile.
        </p>
      ) : (
        <ul className="flex flex-wrap gap-2">
          {anchors.map((anchor) => (
            <li
              key={anchor.label}
              className={cn(
                'group inline-flex items-center gap-2 rounded-full border border-border bg-secondary/60 py-1 pl-3 pr-1.5 text-[12.5px]'
              )}
            >
              <span className="font-medium text-foreground">{anchor.label}</span>
              <span className="text-[10.5px] uppercase tracking-[0.12em] text-muted-foreground">
                {anchor.kind}
              </span>
              <button
                type="button"
                onClick={() => onChange(anchors.filter((a) => a.label !== anchor.label))}
                aria-label={`Remove ${anchor.label}`}
                className="grid h-5 w-5 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-background hover:text-foreground"
              >
                <X className="h-3 w-3" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}