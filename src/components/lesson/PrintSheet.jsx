import HandoutSheet from '@/components/lesson/HandoutSheet';
import { Printer, X } from 'lucide-react';

export default function PrintSheet({ handout, brief, onClose }) {
  return (
    <div className="fixed inset-0 z-50 overflow-auto bg-background">
      <div className="no-print sticky top-0 z-10 flex flex-col gap-3 border-b border-border bg-background/95 px-5 py-3 backdrop-blur sm:flex-row sm:items-center sm:justify-between sm:px-8">
        <div className="min-w-0">
          <p className="text-[13px] font-medium">Handout preview</p>
          <p className="text-[11.5px] leading-snug text-muted-foreground">
            Check every name and detail. Print or save as PDF to use it offline.
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-[12.5px] font-medium transition-colors hover:border-primary/40"
          >
            <X className="h-3.5 w-3.5" /> Close
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3.5 py-1.5 text-[12.5px] font-medium text-primary-foreground transition-opacity hover:opacity-90"
          >
            <Printer className="h-3.5 w-3.5" /> Print / save PDF
          </button>
        </div>
      </div>

      <div className="mx-auto max-w-[860px] px-4 py-8">
        <div className="print-area mx-auto bg-card shadow-[0_1px_3px_hsl(156_14%_13%/0.08),0_24px_60px_-40px_hsl(156_14%_13%/0.45)] ring-1 ring-border/70">
          <HandoutSheet handout={handout} brief={brief} />
        </div>
      </div>
    </div>
  );
}