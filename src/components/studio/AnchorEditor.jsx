import { useState } from 'react';
import { ANCHOR_KINDS } from '@/lib/studioData';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Plus, X } from 'lucide-react';

export default function AnchorEditor({ anchors = [], onChange }) {
  const [label, setLabel] = useState('');
  const [kind, setKind] = useState(ANCHOR_KINDS[0]);
  const [feedback, setFeedback] = useState('');

  const currentAnchors = Array.isArray(anchors) ? anchors : [];

  const add = () => {
    const value = label.trim();

    if (!value) {
      setFeedback('Enter a film, book, artist, genre, sport or place before pressing Add.');
      return;
    }

    const duplicate = currentAnchors.some(
      (anchor) => anchor.label?.trim().toLowerCase() === value.toLowerCase()
    );

    if (duplicate) {
      setFeedback('“' + value + '” is already in your cultural anchors.');
      return;
    }

    onChange([...currentAnchors, { label: value, kind }]);
    setLabel('');
    setFeedback('Added “' + value + '” as ' + kind + '. It should now appear below.');
  };

  const remove = (labelToRemove) => {
    onChange(currentAnchors.filter((anchor) => anchor.label !== labelToRemove));
    setFeedback('Removed “' + labelToRemove + '”.');
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row">
        <Input
          value={label}
          onChange={(e) => {
            setLabel(e.target.value);
            setFeedback('');
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              add();
            }
          }}
          placeholder="e.g. Nollywood drama, Fela Kuti, Afrobeats…"
          className="h-10 flex-1 bg-card"
          aria-label="Cultural anchor"
          aria-describedby="anchor-editor-feedback"
          autoComplete="off"
        />
        <div className="flex gap-2">
          <select
            value={kind}
            onChange={(e) => {
              setKind(e.target.value);
              setFeedback('');
            }}
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
            className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-md border border-primary/25 bg-primary px-3 text-[13px] font-medium text-primary-foreground transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <Plus className="h-3.5 w-3.5" /> Add
          </button>
        </div>
      </div>

      <p
        id="anchor-editor-feedback"
        role="status"
        aria-live="polite"
        className={cn(
          'text-[12px] leading-relaxed',
          feedback ? 'text-foreground' : 'text-muted-foreground'
        )}
      >
        {feedback || (currentAnchors.length === 0
          ? 'No references added yet. Type a reference, choose its kind, then press Add. You can also press Enter.'
          : currentAnchors.length + ' reference' + (currentAnchors.length === 1 ? '' : 's') + ' added. Only these references will be sent to Qloo.')}
      </p>

      {currentAnchors.length > 0 ? (
        <ul className="flex flex-wrap gap-2">
          {currentAnchors.map((anchor) => (
            <li
              key={anchor.label + '-' + anchor.kind}
              className="group inline-flex items-center gap-2 rounded-full border border-border bg-secondary/60 py-1 pl-3 pr-1.5 text-[12.5px]"
            >
              <span className="font-medium text-foreground">{anchor.label}</span>
              <span className="text-[10.5px] uppercase tracking-[0.12em] text-muted-foreground">
                {anchor.kind}
              </span>
              <button
                type="button"
                onClick={() => remove(anchor.label)}
                aria-label={'Remove ' + anchor.label}
                className="grid h-5 w-5 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-background hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <X className="h-3 w-3" />
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}