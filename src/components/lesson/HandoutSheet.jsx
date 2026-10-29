export default function HandoutSheet({ handout, brief }) {
  return (
    <div className="w-full bg-card px-6 py-7 text-foreground sm:px-9 sm:py-9">
      <header className="border-b border-foreground/60 pb-3">
        <p className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
          {brief.classLevel} · English Language · {brief.duration} minutes
        </p>
        <h1 className="mt-1.5 font-heading text-[24px] leading-tight sm:text-[27px]">{handout.title}</h1>
        <p className="mt-1 text-[12px] text-muted-foreground">{brief.objective}</p>
      </header>

      {handout.intro ? <p className="mt-4 text-[13px] leading-relaxed">{handout.intro}</p> : null}

      {handout.sections.map((section, index) => (
        <section key={section.heading} className="print-avoid-break mt-5">
          <h2 className="font-heading text-[15.5px] leading-snug">
            {index + 1}. {section.heading}
          </h2>
          {section.body ? <p className="mt-1 text-[12.5px] leading-relaxed text-foreground/85">{section.body}</p> : null}
          {section.prompts && section.prompts.length ? (
            <ul className="mt-2 space-y-1.5">
              {section.prompts.map((prompt) => (
                <li key={prompt} className="flex gap-2 text-[12.5px] leading-relaxed text-foreground/85">
                  <span className="mt-[3px] inline-block h-3 w-3 shrink-0 rounded-[2px] border border-foreground/40" />
                  {prompt}
                </li>
              ))}
            </ul>
          ) : null}
        </section>
      ))}

      {handout.footer ? (
        <p className="mt-6 border-t border-foreground/30 pt-2 text-[10.5px] leading-relaxed text-muted-foreground">
          {handout.footer}
        </p>
      ) : null}
    </div>
  );
}