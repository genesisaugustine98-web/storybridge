export default function TeacherScript({ script = [] }) {
  return (
    <div className="card-soft divide-y divide-border/60 overflow-hidden">
      {script.map((beat, index) => (
        <div key={`${beat.cue}-${index}`} className="grid gap-2 px-5 py-4 sm:grid-cols-[160px_minmax(0,1fr)] sm:gap-6">
          <div>
            <p className="label-caps">Cue</p>
            <p className="mt-1 text-[12.5px] font-medium leading-snug text-foreground">{beat.cue}</p>
          </div>
          <div>
            <p className="font-heading text-[16px] leading-relaxed text-foreground">
              &ldquo;{beat.say}&rdquo;
            </p>
            {beat.note ? (
              <p className="mt-1.5 border-l-2 border-accent/40 pl-3 text-[12px] leading-relaxed text-muted-foreground">
                {beat.note}
              </p>
            ) : null}
          </div>
        </div>
      ))}
    </div>
  );
}