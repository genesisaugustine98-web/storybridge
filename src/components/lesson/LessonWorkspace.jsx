import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import LessonHeader from '@/components/lesson/LessonHeader';
import LessonPlan from '@/components/lesson/LessonPlan';
import TeacherScript from '@/components/lesson/TeacherScript';
import ActivityAssessment from '@/components/lesson/ActivityAssessment';
import HandoutSheet from '@/components/lesson/HandoutSheet';
import PrintSheet from '@/components/lesson/PrintSheet';
import { ArrowLeft, ArrowRight, Printer } from 'lucide-react';

export default function LessonWorkspace({ lesson, brief, mode, validation, onCompare, onBack }) {
  const [printing, setPrinting] = useState(false);
  const draftLabel = mode === 'demo'
    ? 'Teacher references · no Qloo'
    : mode === 'curriculum'
      ? 'Curriculum-only'
      : 'Qloo-informed';

  return (
    <div className="space-y-6">
      <LessonHeader lesson={lesson} brief={brief} mode={mode} validation={validation} draftLabel={draftLabel} />

      <Tabs defaultValue="plan">
        <TabsList className="flex h-auto w-full flex-wrap justify-start gap-1 rounded-xl bg-secondary/60 p-1">
          <TabsTrigger value="plan" className="rounded-lg px-3 py-1.5 text-[12.5px]">Lesson plan</TabsTrigger>
          <TabsTrigger value="script" className="rounded-lg px-3 py-1.5 text-[12.5px]">Teacher script</TabsTrigger>
          <TabsTrigger value="activity" className="rounded-lg px-3 py-1.5 text-[12.5px]">Activity &amp; assessment</TabsTrigger>
          <TabsTrigger value="handout" className="rounded-lg px-3 py-1.5 text-[12.5px]">Handout</TabsTrigger>
        </TabsList>

        <TabsContent value="plan" className="mt-5">
          <LessonPlan plan={lesson.plan} />
        </TabsContent>

        <TabsContent value="script" className="mt-5">
          <TeacherScript script={lesson.teacherScript} />
        </TabsContent>

        <TabsContent value="activity" className="mt-5">
          <ActivityAssessment activity={lesson.activity} assessment={lesson.assessment} />
        </TabsContent>

        <TabsContent value="handout" className="mt-5 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-[12.5px] text-muted-foreground">
              One page, no internet needed. Print it or save it as a PDF for offline use.
            </p>
            <button
              type="button"
              onClick={() => setPrinting(true)}
              className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3.5 py-1.5 text-[12.5px] font-medium text-primary-foreground transition-opacity hover:opacity-90"
            >
              <Printer className="h-3.5 w-3.5" /> Open printable handout
            </button>
          </div>
          <div className="overflow-hidden rounded-xl border border-border bg-secondary/40 p-3 sm:p-5">
            <div className="mx-auto max-w-[720px] bg-card ring-1 ring-border/70">
              <HandoutSheet handout={lesson.handout} brief={brief} />
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <div className="flex flex-col gap-3 border-t border-border/70 pt-4 sm:flex-row sm:items-center sm:justify-between">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-[12.5px] text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to the evidence
        </button>
        <button
          type="button"
          onClick={onCompare}
          className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-5 py-2.5 text-[13.5px] font-medium text-primary-foreground transition-opacity hover:opacity-90"
        >
          Compare with the curriculum-only draft
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>

      {printing ? (
        <PrintSheet handout={lesson.handout} brief={brief} onClose={() => setPrinting(false)} />
      ) : null}
    </div>
  );
}