import { useEffect, useState } from 'react';
import Header from '@/components/studio/Header';
import Footer from '@/components/studio/Footer';
import StepRail from '@/components/studio/StepRail';
import BriefForm from '@/components/studio/BriefForm';
import EvidencePanel from '@/components/studio/EvidencePanel';
import ComparePanel from '@/components/studio/ComparePanel';
import LessonWorkspace from '@/components/lesson/LessonWorkspace';
import { EMPTY_BRIEF, EXAMPLE_BRIEF } from '@/lib/studioData';
import { base44 } from '@/api/base44Client';
import { AlertTriangle, Check, Loader2 } from 'lucide-react';

const DELIVERABLES = [
  'Lesson plan with timings',
  'Teacher script with cues',
  'One classroom activity',
  '3 assessment questions',
  'Answers and marking rubric',
  'Printable offline handout',
];

function messageOf(error) {
  const data = error && error.response && error.response.data;
  if (data && data.error) return data.error;
  if (error && error.message) return error.message;
  return 'Something went wrong, and nothing was filled in to hide it.';
}

export default function Studio() {
  const [brief, setBrief] = useState(EMPTY_BRIEF);
  const [step, setStep] = useState(1);
  const [maxStep, setMaxStep] = useState(1);
  const [status, setStatus] = useState('checking');
  const [qloo, setQloo] = useState(null);
  const [demo, setDemo] = useState(false);
  const [lesson, setLesson] = useState(null);
  const [busy, setBusy] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await base44.functions.invoke('qlooEvidence', { probe: true });
        if (cancelled) return;
        const mode = res.data && res.data.mode;
        setStatus(mode === 'live' ? 'live' : mode === 'setup' ? 'setup' : mode === 'no-matches' ? 'no-matches' : 'unavailable');
      } catch {
        if (!cancelled) setStatus('unavailable');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const advance = (next) => {
    setStep(next);
    setMaxStep((current) => Math.max(current, next));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const go = (next) => {
    if (next > maxStep) return;
    setStep(next);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const checkEvidence = async () => {
    setBusy('qloo');
    setError('');
    try {
      const res = await base44.functions.invoke('qlooEvidence', { anchors: brief.anchors });
      const data = res.data || {};
      setQloo(data);
      setDemo(false);
      setStatus(data.mode === 'live' ? 'live' : data.mode === 'setup' ? 'setup' : data.mode === 'no-matches' ? 'no-matches' : 'unavailable');
      advance(2);
    } catch (err) {
      setStatus('unavailable');
      setQloo({
        mode: 'unavailable',
        detail: 'The culture check request failed before Qloo answered, so there is no evidence to show.',
        anchors: brief.anchors.map((a) => ({ ...a, resolved: null })),
        candidates: [],
        calls: [],
        endpoints: [],
      });
      setError(messageOf(err));
      advance(2);
    } finally {
      setBusy(null);
    }
  };

  const startDemo = () => {
    setError('');
    if (!brief.anchors.length) {
      setError('Demo mode uses only your own references. Add at least one cultural anchor to the brief first.');
      return;
    }
    setDemo(true);
    setQloo({
      mode: 'demo',
      detail: 'Demo mode uses only the references you typed.',
      anchors: brief.anchors.map((a) => ({ ...a, resolved: null })),
      candidates: [],
      calls: [],
      endpoints: [],
    });
    setStatus('demo');
    advance(2);
  };

  const buildLesson = async () => {
    setBusy('lesson');
    setError('');
    try {
      const evidence = demo
        ? { mode: 'demo', anchors: qloo ? qloo.anchors : brief.anchors, candidates: [] }
        : { mode: 'qloo', anchors: qloo ? qloo.anchors : [], candidates: qloo ? qloo.candidates : [] };

      const res = await base44.functions.invoke('generateLesson', {
        brief,
        evidence,
        demo,
        anchors: brief.anchors,
      });
      if (res.data && res.data.error) throw new Error(res.data.error);
      setLesson(res.data);
      advance(3);
    } catch (err) {
      setError(messageOf(err));
    } finally {
      setBusy(null);
    }
  };

  const showCompare = step >= 3 && lesson;
  const activeStep = lesson ? step : Math.min(step, 2);

  return (
    <div className="min-h-screen">
      <Header status={status} />

      <main className="mx-auto w-full max-w-6xl px-5 pb-16 pt-8 sm:px-8 lg:pt-12">
        <div className="grid gap-8 lg:grid-cols-[228px_minmax(0,1fr)] lg:gap-12">
          <StepRail current={activeStep} maxStep={maxStep} onSelect={go} />

          <div className="min-w-0 space-y-7">
            {error ? (
              <div className="flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/8 px-4 py-3">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
                <p className="text-[12.5px] leading-relaxed text-foreground/85">{error}</p>
              </div>
            ) : null}

            {activeStep === 1 ? (
              <>
                <header className="rise-in">
                  <p className="label-caps text-accent">Step one · Brief</p>
                  <h1 className="mt-3 font-heading text-[34px] leading-[1.06] sm:text-[44px]">
                    One objective.
                    <br />
                    One grounded lesson.
                  </h1>
                  <p className="mt-3 max-w-xl text-[14px] leading-relaxed text-muted-foreground">
                    StoryBridge turns a single English Language objective into a lesson you can teach on Monday: a
                    plan, a script, one activity, three questions, a rubric sheet — and a culture check that shows
                    its working.
                  </p>
                </header>

                <BriefForm
                  brief={brief}
                  onChange={setBrief}
                  onLoadExample={() => setBrief(EXAMPLE_BRIEF)}
                  onSubmit={checkEvidence}
                  busy={busy === 'qloo'}
                />

                <section className="rounded-xl border border-border/80 bg-card/70 px-5 py-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="label-caps">Example run</p>
                      <p className="mt-1 text-[13.5px] font-medium">Persuasive language in public-service messages</p>
                      <p className="mt-1 text-[12px] text-muted-foreground">
                        SSS 2 · 45 minutes · teacher-chosen anchors: Nollywood drama, Fela Kuti, Afrobeats
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setBrief(EXAMPLE_BRIEF)}
                      className="shrink-0 rounded-full border border-border bg-card px-3 py-1.5 text-[12px] font-medium transition-colors hover:border-primary/40"
                    >
                      Load this brief
                    </button>
                  </div>
                </section>

                <section>
                  <p className="label-caps mb-2">What you leave with</p>
                  <ul className="grid gap-2 sm:grid-cols-2">
                    {DELIVERABLES.map((item) => (
                      <li key={item} className="flex items-center gap-2 text-[12.5px] text-foreground/80">
                        <Check className="h-3.5 w-3.5 shrink-0 text-primary" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </section>
              </>
            ) : null}

            {activeStep === 2 && qloo ? (
              <>
                <header className="rise-in">
                  <p className="label-caps text-accent">Step two · Culture check</p>
                  <h1 className="mt-3 font-heading text-[30px] leading-[1.1] sm:text-[36px]">
                    {qloo.mode === 'live' ? 'What Qloo returned for your anchors' : 'The culture check, stated plainly'}
                  </h1>
                  <p className="mt-2 max-w-2xl text-[13.5px] leading-relaxed text-muted-foreground">
                    {qloo.mode === 'live'
                      ? 'These are live API results. The lesson draft may only use examples from the list below.'
                      : 'No Qloo data is being shown — because none is available for this run.'}
                  </p>
                </header>

                <EvidencePanel
                  data={qloo}
                  busy={busy === 'lesson'}
                  onContinue={buildLesson}
                  onDemo={demo ? buildLesson : startDemo}
                  onRetry={checkEvidence}
                  onBack={() => go(1)}
                />
              </>
            ) : null}

            {activeStep === 3 && lesson ? (
              <LessonWorkspace
                lesson={lesson.informed}
                brief={lesson.brief || brief}
                mode={lesson.mode}
                validation={lesson.validation}
                onCompare={() => advance(4)}
                onBack={() => go(2)}
              />
            ) : null}

            {showCompare && activeStep === 4 ? (
              <>
                <header className="rise-in">
                  <p className="label-caps text-accent">Step four · Compare</p>
                  <h1 className="mt-3 font-heading text-[30px] leading-[1.1] sm:text-[36px]">
                    {lesson.mode === 'demo' ? 'Teacher anchors vs curriculum only' : 'Qloo-informed vs curriculum only'}
                  </h1>
                  <p className="mt-2 max-w-2xl text-[13.5px] leading-relaxed text-muted-foreground">
                    The same objective, drafted twice: once with no cultural references at all, once with the
                    culture step applied.
                  </p>
                </header>
                <ComparePanel lesson={lesson} onBack={() => go(3)} />
              </>
            ) : null}

            {busy === 'lesson' && activeStep === 2 ? (
              <div className="flex items-center justify-center gap-3 rounded-xl border border-border bg-card px-4 py-6 text-[13px] text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Drafting the lesson, the script, the activity and the handout…
              </div>
            ) : null}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}