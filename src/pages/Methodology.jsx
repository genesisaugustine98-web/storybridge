import { Link } from 'react-router-dom';
import Header from '@/components/studio/Header';
import Footer from '@/components/studio/Footer';

const ENDPOINTS = [
  {
    method: 'GET',
    path: '/search',
    params: 'query, types, take, sort_by',
    purpose: 'Resolves each teacher anchor to a real Qloo entity id.',
  },
  {
    method: 'GET',
    path: '/v2/insights',
    params: 'filter.type, signal.interests.entities, take=8, feature.explainability=true',
    purpose: 'Returns affinity-ranked related entities, used as the candidate classroom examples.',
  },
];

function Section({ number, title, children }) {
  return (
    <section className="border-t border-border/70 pt-6">
      <h2 className="font-heading text-[22px] leading-snug">
        <span className="mr-2 text-[13px] tnum text-muted-foreground">{number}</span>
        {title}
      </h2>
      <div className="mt-3 space-y-3 text-[13.5px] leading-relaxed text-foreground/85">{children}</div>
    </section>
  );
}

export default function Methodology() {
  return (
    <div className="min-h-screen">
      <Header />

      <main className="mx-auto w-full max-w-3xl px-5 pb-16 pt-8 sm:px-8 lg:pt-12">
        <Link
          to="/"
          className="text-[12.5px] text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
        >
          ← Back to the studio
        </Link>

        <header className="mt-5">
          <p className="label-caps text-accent">About &amp; methodology</p>
          <h1 className="mt-3 font-heading text-[34px] leading-[1.08] sm:text-[40px]">
            What is real here, and what is a draft.
          </h1>
          <p className="mt-3 text-[14px] leading-relaxed text-muted-foreground">
            StoryBridge does one narrow job: one English Language objective in, one reviewable lesson out. It does not
            build schemes of work, grade pupils, or profile learners.
          </p>
        </header>

        <div className="mt-8 space-y-7">
          <Section number="01" title="The four steps">
            <p>
              <strong>Brief</strong> — class level, one objective, duration, the materials you actually have, and
              optionally cultural anchors you choose. <strong>Culture check</strong> — the server asks Qloo about those
              anchors and shows you exactly what came back. <strong>Lesson</strong> — plan, teacher script, one activity,
              three questions, answers, rubric and a printable handout. <strong>Compare</strong> — the same objective
              drafted without any cultural grounding, side by side with the informed draft.
            </p>
          </Section>

          <Section number="02" title="How the Qloo step works">
            <p>
              Calls are made only from the server, to <code className="rounded bg-muted px-1 py-0.5 font-mono text-[11.5px]">https://api.qloo.com</code>,
              with the key read from the <code className="rounded bg-muted px-1 py-0.5 font-mono text-[11.5px]">QLOO_API_KEY</code> secret.
              The key is never sent to the browser and never appears in a page, a URL or a response.
            </p>
            <ol className="list-decimal space-y-1.5 pl-5">
              <li>Each anchor is searched once to get a real Qloo entity id. If nothing is found, the anchor is shown as unresolved — nothing is guessed.</li>
              <li>One Insights call per example type (film, book, music artist) is sent with all resolved anchors as the seed signal.</li>
              <li>Each returned entity keeps its own <code className="rounded bg-muted px-1 py-0.5 font-mono text-[11px]">query.affinity</code> and, when available, its explainability entries naming the anchors that drove it.</li>
              <li>That list is the only cultural material the lesson writer may cite.</li>
              <li>The server then rebuilds every cited example from the Qloo payload itself — name, entity id, affinity and drivers — so no score displayed in the app was written by the language model.</li>
            </ol>
            <div className="overflow-hidden rounded-xl border border-border">
              <table className="w-full text-left text-[12px]">
                <thead className="bg-secondary/60">
                  <tr>
                    <th className="px-3 py-2 font-medium">Method</th>
                    <th className="px-3 py-2 font-medium">Path</th>
                    <th className="px-3 py-2 font-medium">Parameters</th>
                    <th className="px-3 py-2 font-medium">Purpose</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {ENDPOINTS.map((endpoint) => (
                    <tr key={endpoint.path}>
                      <td className="px-3 py-2 font-mono text-[11px]">{endpoint.method}</td>
                      <td className="px-3 py-2 font-mono text-[11px]">{endpoint.path}</td>
                      <td className="px-3 py-2 font-mono text-[10.5px] text-muted-foreground">{endpoint.params}</td>
                      <td className="px-3 py-2 text-muted-foreground">{endpoint.purpose}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-[12.5px] text-muted-foreground">
              The culture check panel shows the real call trace: endpoint path, HTTP status and duration for each call
              in that run. The app only shows <em>Qloo live</em> after a call has actually succeeded.
            </p>
          </Section>

          <Section number="03" title="Evidence and reasoning are kept apart">
            <p>
              Qloo evidence is what the API returned: matched entities, their identifiers, their affinity values and
              the anchors each result is linked to. It is displayed in the culture-check panel and on each example card.
            </p>
            <p>
              Lesson reasoning is everything the writing model decided: the phases, the teacher script, the activity,
              the questions and the rubric. It is labelled as a draft, and it never carries a Qloo number of its own.
            </p>
          </Section>

          <Section number="04" title="What affinity does not mean">
            <p>
              Affinity describes how strongly one thing is associated with another in audience taste data. It is not a
              measure of learning suitability, age-appropriateness, curriculum fit, safety, or any individual
              pupil&apos;s preference. A high score does not mean an example will work in your classroom; a low score
              does not mean it will fail. You are the judge of that.
            </p>
          </Section>

          <Section number="05" title="Privacy">
            <p>
              There are no pupil accounts, names or taste profiles anywhere in this app. Cultural anchors are typed by
              the teacher, about culture rather than about children. Lessons are not stored on a server: they exist in
              your browser for the session, and the printable handout is the only copy you can keep.
            </p>
          </Section>

          <Section number="06" title="What needs a Qloo key">
            <p>
              Everything in the culture check depends on a working <code className="rounded bg-muted px-1 py-0.5 font-mono text-[11.5px]">QLOO_API_KEY</code>.
              Without it, StoryBridge shows a setup state and offers a clearly labelled demo mode that uses only your
              own references — with no Qloo entities, no affinity scores and no claim that a taste API endorsed them.
            </p>
          </Section>

          <Section number="07" title="Known limits">
            <p>
              Qloo coverage is uneven outside its strongest markets, so some Nigerian anchors may not resolve; those are
              reported as unresolved rather than substituted. Affinity ranks cultural adjacency, not pedagogical value.
              And the lesson text is a model draft: check facts, names, language level and suitability before you teach it.
            </p>
          </Section>
        </div>
      </main>

      <Footer />
    </div>
  );
}