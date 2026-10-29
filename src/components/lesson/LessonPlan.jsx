export default function LessonPlan({ plan = [] }) {
  return (
    <div className="space-y-3">
      {plan.map((phase, index) => (
        <article key={`${phase.phase}-${index}`} className="card-soft p-5">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h3 className="font-heading text-[17px] leading-snug">
              <span className="mr-2 text-[13px] tnum text-muted-foreground">{String(index + 1).padStart(2, '0')}</span>
              {phase.phase}
            </h3>
            <span className="rounded-full border border-border px-2 py-0.5 text-[11px] tnum text-muted-foreground">
              {phase.minutes} min
            </span>
          </div>

          <div className="mt-3 grid gap-4 sm:grid-cols-2 sm:gap-6">
            <div>
              <p className="label-caps">Teacher moves</p>
              <ul className="mt-1.5 space-y-1.5">
                {(phase.teacherMoves || []).map((move) => (
                  <li key={move} className="flex gap-2 text-[12.5px] leading-relaxed text-foreground/85">
                    <span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-primary/60" />
                    {move}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="label-caps">Learners do</p>
              <ul className="mt-1.5 space-y-1.5">
                {(phase.learnersDo || []).map((item) => (
                  <li key={item} className="flex gap-2 text-[12.5px] leading-relaxed text-muted-foreground">
                    <span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-border" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}