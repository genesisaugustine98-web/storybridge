import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="mt-14 border-t border-border/70 bg-secondary/30">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-5 py-8 text-[12px] leading-relaxed text-muted-foreground sm:flex-row sm:items-start sm:justify-between sm:px-8">
        <p className="max-w-xl">
          StoryBridge drafts lessons for teacher review. Qloo affinity describes taste adjacency between
          audiences — it is not evidence of learning suitability, and never a pupil&apos;s preference.
        </p>
        <div className="flex shrink-0 gap-4">
          <Link to="/methodology" className="underline-offset-4 hover:text-foreground hover:underline">
            Methodology &amp; limits
          </Link>
        </div>
      </div>
    </footer>
  );
}