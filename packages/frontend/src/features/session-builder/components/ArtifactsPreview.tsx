import * as React from 'react';
import { Button, Card, CardContent, CardHeader, CardTitle, Progress, Tabs, TabsContent, TabsList, TabsTrigger } from '../../../ui';
import { SessionOutline } from '../../../services/session-builder.service';
import { AIContentVersion, SessionMetadata } from '../state/types';

interface ArtifactsPreviewProps {
  metadata: SessionMetadata;
  outline: SessionOutline | null;
  readinessScore: number;
  activeVersion?: AIContentVersion;
  onOpenQuickAdd: () => void;
}

export const ArtifactsPreview: React.FC<ArtifactsPreviewProps> = ({
  metadata,
  outline,
  readinessScore,
  activeVersion,
  onOpenQuickAdd,
}) => {
  const [tab, setTab] = React.useState('landing');

  const sessionTitle = metadata.title || activeVersion?.summary || 'Untitled Session';
  const sessionSummary = activeVersion?.summary || metadata.desiredOutcome || 'Draft summary will appear here once AI content is accepted.';

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-base">Readiness Overview</CardTitle>
            <p className="text-xs text-slate-500">
              Readiness increases as required fields, AI content, and outline sections are completed.
            </p>
          </div>
          <Button size="sm" variant="outline" onClick={onOpenQuickAdd}>
            Quick Add Section
          </Button>
        </CardHeader>
        <CardContent>
          <Progress value={readinessScore} label="Publish Readiness" />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Live Preview</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={tab} defaultValue="landing" onValueChange={setTab}>
            <TabsList>
              <TabsTrigger value="landing">Landing Page</TabsTrigger>
              <TabsTrigger value="outline">Outline</TabsTrigger>
              <TabsTrigger value="trainer">Trainer Kit</TabsTrigger>
            </TabsList>

            <TabsContent value="landing" className="space-y-4">
              <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="text-lg font-semibold">{sessionTitle}</h2>
                <p className="mt-2 text-sm text-slate-600">{sessionSummary}</p>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-lg bg-blue-50 p-4">
                    <p className="text-xs font-semibold uppercase text-blue-600">Key Outcome</p>
                    <p className="mt-1 text-sm text-blue-900">
                      {metadata.desiredOutcome || 'Define the learner outcome to personalize messaging.'}
                    </p>
                  </div>
                  <div className="rounded-lg bg-slate-100 p-4">
                    <p className="text-xs font-semibold uppercase text-slate-600">Audience</p>
                    <p className="mt-1 text-sm text-slate-700">
                      {metadata.specificTopics || 'Audience focus and practice areas will render here.'}
                    </p>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="outline" className="space-y-3">
              {outline && outline.sections.length > 0 ? (
                outline.sections.map((section) => (
                  <div key={section.id} className="rounded-lg border border-slate-200 bg-white p-4">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold">{section.title}</p>
                      <span className="text-xs text-slate-400">{section.duration} min</span>
                    </div>
                    <p className="mt-1 text-sm text-slate-600">{section.description}</p>
                  </div>
                ))
              ) : (
                <div className="rounded-lg border border-dashed border-slate-300 bg-slate-100/60 p-6 text-center text-sm text-slate-500">
                  No outline sections yet. Generate AI content or add a section to get started.
                </div>
              )}
            </TabsContent>

            <TabsContent value="trainer" className="space-y-3">
              <div className="rounded-lg border border-slate-200 bg-white p-5">
                <h3 className="text-sm font-semibold">Trainer briefing placeholder</h3>
                <p className="mt-2 text-sm text-slate-600">
                  Phase 4 will populate trainer prep notes once the training kit pipeline is in place.
                  For now, accepted AI content and outline context provide the scaffolding for what will ship next.
                </p>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};
