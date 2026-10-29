export default function ActivityAssessment({ activity, assessment = [] }) {
  return (
    <div className="space-y-5">
      <article className="card-soft p-5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="label-caps">Classroom activity</span>
          {activity.grouping ? (
            <span className="rounded-full border border-border px-2 py-0.5 text-[10.5px] text-muted-foreground">
              {activity.grouping}
            </span>
          ) : null}
          {activity.minutes ? (
            <span className="rounded-full border border-border px-2 py-0.5 text-[10.5px] tnum text-muted-foreground">
              {activity.minutes} min
            </span>
          ) : null}
        </div>
        <h3 className="mt-2 font-heading text-[19px] leading-snug">{activity.title}</h3>

        <ol className="mt-3 space-y-2">
          {(activity.steps || []).map((step, index) => (
            <li key={step} className="flex gap-3 text-[12.5px] leading-relaxed text-foreground/85">
              <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full border border-border text-[10.5px] tnum text-muted-foreground">
                {index + 1}
              </span>
              {step}
            </li>
          ))}
        </ol>

        {activity.successLooksLike && activity.successLooksLike.length ? (
          <div className="mt-4 rounded-lg bg-secondary/60 px-3 py-2.5">
            <p className="label-caps">Success looks like</p>
            <ul className="mt-1 space-y-1">
              {activity.successLooksLike.map((item) => (
                <li key={item} className="text-[12px] leading-relaxed text-foreground/80">
                  {item}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </article>

      <section>
        <p className="label-caps mb-2">Assessment · 3 questions</p>
        <div className="space-y-3">
          {assessment.map((item, index) => (
            <article key={item.question} className="card-soft p-5">
              <div className="flex items-baseline justify-between gap-3">
                <p className="text-[13.5px] font-medium leading-snug">
                  <span className="mr-2 text-[12px] tnum text-muted-foreground">Q{index + 1}</span>
                  {item.question}
                </p>
                <span className="shrink-0 rounded-full border border-border px-2 py-0.5 text-[10.5px] tnum text-muted-foreground">
                  {item.marks} mark{item.marks === 1 ? '' : 's'}
                </span>
              </div>

              <p className="mt-2.5 text-[12.5px] leading-relaxed text-foreground/80">
                <span className="font-medium text-foreground">Model answer: </span>
                {item.answer}
              </p>

              {item.rubric && item.rubric.length ? (
                <div className="mt-3 overflow-hidden rounded-lg border border-border/70">
                  <table className="w-full text-left text-[12px]">
                    <tbody className="divide-y divide-border/70">
                      {item.rubric.map((band) => (
                        <tr key={band.band}>
                          <th scope="row" className="w-[92px] bg-secondary/50 px-3 py-1.5 align-top font-medium">
                            {band.band}
                          </th>
                          <td className="px-3 py-1.5 align-top text-muted-foreground">{band.descriptor}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : null}
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}