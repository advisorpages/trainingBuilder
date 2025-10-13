import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Session, SessionStatus, Trainer, Incentive } from '@leadership-training/shared';
import { sessionService } from '../services/session.service';
import { topicService } from '../services/topic.service';
import { trainerService } from '../services/trainer.service';
import { incentiveService } from '../services/incentive.service';
import { LocationSelect } from '../components/ui/LocationSelect';
import { AudienceSelect } from '../components/ui/AudienceSelect';
import { ToneSelect } from '../components/ui/ToneSelect';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { BuilderLayout } from '../layouts/BuilderLayout';
import { Topic } from '@leadership-training/shared';
import { SessionTopicDetail } from '../components/sessions/EnhancedTopicCard';
import { SessionFlowSummary } from '../features/session-builder/components/SessionFlowSummary';
import { TopicSelectionModal } from '../features/session-builder/components/TopicSelectionModal';
import { EditTopicDetailsModal } from '../features/session-builder/components/EditTopicDetailsModal';

interface FormData {
  title: string;
  subtitle?: string;
  objective?: string;
  topicIds: number[];
  sessionTopics: SessionTopicDetail[];
  locationId?: number;
  audienceId?: number;
  toneId?: number;
  startTime?: string;
  endTime?: string;
  status?: SessionStatus;
  readinessScore?: number;
  incentiveIds?: string[];
}

interface FormErrors {
  [key: string]: string;
}

const SessionEditPage: React.FC = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();

  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    title: '',
    subtitle: '',
    objective: '',
    topicIds: [],
    sessionTopics: [],
    status: SessionStatus.DRAFT,
    readinessScore: 0,
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isTopicModalOpen, setIsTopicModalOpen] = useState(false);
  const [editingTopicId, setEditingTopicId] = useState<number | null>(null);

  // Dropdown options
  const [topics, setTopics] = useState<Topic[]>([]);
  const [trainers, setTrainers] = useState<Trainer[]>([]);
  const [incentives, setIncentives] = useState<Incentive[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Current associations
  const [currentIncentives, setCurrentIncentives] = useState<Incentive[]>([]);

  // Load session data
  useEffect(() => {
    if (!sessionId) {
      navigate('/sessions');
      return;
    }

    const loadSession = async () => {
      try {
        setLoading(true);
        const sessionData = await sessionService.getSession(sessionId);
        console.log('[SessionEditPage] Loaded session data:', sessionData);
        setSession(sessionData);
        const sessionWithRelations = sessionData as Session & {
          incentives?: Incentive[];
        sessionTopics?: Array<{
          sessionId: string;
          topicId: number;
          sequenceOrder?: number | null;
          durationMinutes?: number | null;
          trainerId?: number | null;
          notes?: string | null;
          topic?: Topic;
          trainer?: Trainer;
        }>;
        topics?: Topic[];
      };

        console.log('[SessionEditPage] Session topics from API:', sessionWithRelations.sessionTopics);
        console.log('[SessionEditPage] Direct topics from API:', sessionWithRelations.topics);

        // Extract topics from sessionTopics relation
        const topicsFromSessionTopics: Topic[] = (sessionWithRelations.sessionTopics || [])
          .map(st => st.topic)
          .filter((topic): topic is Topic => topic !== undefined && topic !== null);

        // Combine with direct topics relation and deduplicate by ID
        const allTopicsMap = new Map<number, Topic>();

        // Add topics from direct relation
        (sessionWithRelations.topics || []).forEach(topic => {
          allTopicsMap.set(topic.id, topic);
        });

        // Add topics from sessionTopics relation (will override if duplicate)
        topicsFromSessionTopics.forEach(topic => {
          allTopicsMap.set(topic.id, topic);
        });

        const allTopics = Array.from(allTopicsMap.values());
        console.log('[SessionEditPage] Combined topics for display:', allTopics);

        // Update topics state immediately with topics from session
        if (allTopics.length > 0) {
          setTopics(prev => {
            const existingIds = new Set(prev.map(topic => topic.id));
            const newTopics = allTopics.filter(topic => !existingIds.has(topic.id));
            const combined = newTopics.length > 0 ? [...prev, ...newTopics] : prev;
            console.log('[SessionEditPage] Updated topics state:', combined);
            return combined;
          });
        }

        const sessionTopicDetails: SessionTopicDetail[] = (sessionWithRelations.sessionTopics || []).map((sessionTopic, index) => ({
          topicId: sessionTopic.topicId,
          sequenceOrder: sessionTopic.sequenceOrder ?? index + 1,
          durationMinutes: sessionTopic.durationMinutes ?? 30,
          assignedTrainerId: sessionTopic.trainerId ?? undefined,
          notes: sessionTopic.notes ?? '',
        })).sort((a, b) => a.sequenceOrder - b.sequenceOrder);

        const fallbackTopicDetails: SessionTopicDetail[] = sessionTopicDetails.length > 0
          ? sessionTopicDetails
          : allTopics.map((topic, index) => ({
              topicId: topic.id,
              sequenceOrder: index + 1,
              durationMinutes: 30,
              assignedTrainerId: undefined,
              notes: '',
            }));

        console.log('[SessionEditPage] Final sessionTopicDetails:', fallbackTopicDetails);

        setFormData({
          title: sessionData.title || '',
          subtitle: sessionData.subtitle || '',
          objective: sessionData.objective || '',
          topicIds: fallbackTopicDetails.map(detail => detail.topicId),
          sessionTopics: fallbackTopicDetails,
          locationId: sessionData.locationId || undefined,
          audienceId: sessionData.audienceId || undefined,
          toneId: sessionData.toneId || undefined,
          startTime: sessionData.startTime ? new Date(sessionData.startTime).toISOString().slice(0, 16) : '',
          endTime: sessionData.endTime ? new Date(sessionData.endTime).toISOString().slice(0, 16) : '',
          status: sessionData.status || SessionStatus.DRAFT,
          readinessScore: sessionData.readinessScore || 0,
          incentiveIds: sessionWithRelations.incentives?.map(inc => inc.id) || [],
        });

        setCurrentIncentives(sessionWithRelations.incentives || []);
      } catch (error) {
        console.error('[SessionEditPage] Failed to load session:', error);
        setLoadError('Failed to load session data. Please try refreshing the page.');
        navigate('/sessions');
      } finally {
        setLoading(false);
      }
    };

    loadSession();
  }, [sessionId, navigate]);

  // Load dropdown options
  useEffect(() => {
    const loadDropdownOptions = async () => {
      try {
        console.log('[SessionEditPage] Loading dropdown options...');
        const [topicsData, trainersData, incentivesData] = await Promise.all([
          topicService.getActiveTopics(),
          trainerService.getActiveTrainers(),
          incentiveService.getIncentives(),
        ]);

        console.log('[SessionEditPage] Loaded topics:', topicsData.length, 'topics');
        console.log('[SessionEditPage] Loaded trainers:', trainersData);
        console.log('[SessionEditPage] Trainers count:', trainersData.length);
        console.log('[SessionEditPage] Loaded incentives:', incentivesData.length, 'incentives');

        // Only update topics state if we haven't already loaded topics from the session
        // This prevents overwriting topics that were loaded from sessionTopics relation
        setTopics(prevTopics => {
          // Merge with existing topics, keeping session topics priority
          const existingIds = new Set(prevTopics.map(t => t.id));
          const newTopics = topicsData.filter(t => !existingIds.has(t.id));
          const merged = prevTopics.length > 0 ? [...prevTopics, ...newTopics] : topicsData;
          console.log('[SessionEditPage] Merged topics state:', merged.length, 'total topics');
          return merged;
        });

        setTrainers(trainersData);
        setIncentives(incentivesData);

        if (trainersData.length === 0) {
          console.warn('[SessionEditPage] No active trainers found!');
          setLoadError('No active trainers available. Please add trainers in the admin section and mark them as active.');
        } else {
          // Clear any previous trainer-related errors
          setLoadError(null);
        }
      } catch (error) {
        console.error('[SessionEditPage] Failed to load dropdown options:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error('[SessionEditPage] Error details:', errorMessage);
        setLoadError(`Failed to load options: ${errorMessage}. Please refresh the page.`);
      }
    };

    loadDropdownOptions();
  }, []);

  // Track unsaved changes
  useEffect(() => {
    if (session) {
      const sessionWithRelations = session as Session & {
        incentives?: Incentive[];
        sessionTopics?: Array<{
          topicId: number;
          sequenceOrder?: number | null;
          durationMinutes?: number | null;
          trainerId?: number | null;
          notes?: string | null;
        }>;
        topics?: Topic[];
      };

      const originalTopicIds = sessionWithRelations.topics
        ? sessionWithRelations.topics.map(topic => topic.id)
        : [];
      const currentTopicIds = [...(formData.topicIds || [])];

      const originalIncentiveIds = sessionWithRelations.incentives
        ? sessionWithRelations.incentives.map(inc => inc.id).sort()
        : [];
      const currentIncentiveIds = (formData.incentiveIds ?? []).slice().sort();

      const originalTopicAssignments = (sessionWithRelations.sessionTopics ?? [])
        .map((topic) => ({
          topicId: topic.topicId,
          sequenceOrder: topic.sequenceOrder ?? 0,
          durationMinutes: topic.durationMinutes ?? null,
          trainerId: topic.trainerId ?? null,
          notes: (topic.notes ?? '').trim(),
        }))
        .sort((a, b) => (a.sequenceOrder ?? 0) - (b.sequenceOrder ?? 0));

      const currentTopicAssignments = (formData.sessionTopics ?? [])
        .map((detail) => ({
          topicId: detail.topicId,
          sequenceOrder: detail.sequenceOrder,
          durationMinutes: detail.durationMinutes ?? null,
          trainerId: detail.assignedTrainerId ?? null,
          notes: (detail.notes ?? '').trim(),
        }))
        .sort((a, b) => (a.sequenceOrder ?? 0) - (b.sequenceOrder ?? 0));

      const hasChanges =
        formData.title !== (session.title || '') ||
        formData.subtitle !== (session.subtitle || '') ||
        formData.objective !== (session.objective || '') ||
        JSON.stringify(currentTopicIds) !== JSON.stringify(originalTopicIds) ||
        formData.locationId !== (session.locationId || undefined) ||
        formData.audienceId !== (session.audienceId || undefined) ||
        formData.toneId !== (session.toneId || undefined) ||
        formData.startTime !== (session.startTime ? new Date(session.startTime).toISOString().slice(0, 16) : '') ||
        formData.endTime !== (session.endTime ? new Date(session.endTime).toISOString().slice(0, 16) : '') ||
        formData.status !== (session.status || SessionStatus.DRAFT) ||
        formData.readinessScore !== (session.readinessScore || 0) ||
        JSON.stringify(currentIncentiveIds) !== JSON.stringify(originalIncentiveIds) ||
        JSON.stringify(currentTopicAssignments) !== JSON.stringify(originalTopicAssignments);

      setHasUnsavedChanges(hasChanges);
    }
  }, [formData, session]);

  // Note: Topics from session are now loaded directly in the loadSession effect above
  // This effect is kept for any future edge cases where topics might be updated independently
  useEffect(() => {
    if (!session) return;

    const sessionWithRelations = session as Session & {
      sessionTopics?: Array<{
        topic?: Topic;
      }>;
      topics?: Topic[];
    };

    // Extract all topics from session
    const sessionTopicsFromJoin = (sessionWithRelations.sessionTopics || [])
      .map(st => st.topic)
      .filter((topic): topic is Topic => topic !== undefined && topic !== null);

    const directTopics = sessionWithRelations.topics ?? [];
    const allSessionTopics = [...directTopics, ...sessionTopicsFromJoin];

    if (allSessionTopics.length > 0) {
      setTopics(prev => {
        const existingIds = new Set(prev.map(topic => topic.id));
        const additionalTopics = allSessionTopics.filter(topic => !existingIds.has(topic.id));
        if (additionalTopics.length > 0) {
          console.log('[SessionEditPage] Adding additional topics to state:', additionalTopics);
        }
        return additionalTopics.length > 0 ? [...prev, ...additionalTopics] : prev;
      });
    }
  }, [session]);

  const sortedTopics = useMemo(() => {
    const topicsCopy = [...topics];
    topicsCopy.sort((a, b) => {
      // Sort by sectionPosition if available (preserves opener, topics, closing order)
      const aPos = (a as any).aiGeneratedContent?.sectionPosition ?? 999;
      const bPos = (b as any).aiGeneratedContent?.sectionPosition ?? 999;
      if (aPos !== bPos) return aPos - bPos;

      // Fallback to updatedAt for topics without position
      const aUpdated = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
      const bUpdated = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
      return bUpdated - aUpdated;
    });
    return topicsCopy;
  }, [topics]);

  // Filter out already-selected topics for the modal
  const availableTopicsForSelection = useMemo(() => {
    const selectedTopicIds = new Set(formData.sessionTopics.map(st => st.topicId));
    return sortedTopics.filter(topic => !selectedTopicIds.has(topic.id));
  }, [sortedTopics, formData.sessionTopics]);

  const handleTopicSelectionChange = useCallback((details: SessionTopicDetail[]) => {
    const sortedDetails = [...details].sort((a, b) => a.sequenceOrder - b.sequenceOrder);

    setFormData(prev => ({
      ...prev,
      topicIds: sortedDetails.map(detail => detail.topicId),
      sessionTopics: sortedDetails,
    }));
  }, []);

  const handleRemoveTopic = useCallback((topicId: number) => {
    setFormData(prev => {
      const updatedTopics = prev.sessionTopics.filter(t => t.topicId !== topicId);
      // Recalculate sequence orders
      const reorderedTopics = updatedTopics.map((t, index) => ({
        ...t,
        sequenceOrder: index + 1,
      }));

      return {
        ...prev,
        sessionTopics: reorderedTopics,
        topicIds: reorderedTopics.map(t => t.topicId),
      };
    });
  }, []);

  const handleReorderTopics = useCallback((reorderedTopics: SessionTopicDetail[]) => {
    setFormData(prev => ({
      ...prev,
      sessionTopics: reorderedTopics,
      topicIds: reorderedTopics.map(t => t.topicId),
    }));
  }, []);

  const handleEditTopicDetails = useCallback((topicId: number) => {
    setEditingTopicId(topicId);
  }, []);

  const handleSaveTopicDetails = useCallback((updatedDetail: SessionTopicDetail) => {
    setFormData(prev => ({
      ...prev,
      sessionTopics: prev.sessionTopics.map(t =>
        t.topicId === updatedDetail.topicId ? updatedDetail : t
      ),
    }));
    setEditingTopicId(null);
  }, []);

  const handleTopicCreated = useCallback((newTopic: Topic) => {
    // Add the newly created topic to the topics list
    setTopics(prev => [...prev, newTopic]);
  }, []);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }

    if (formData.startTime && formData.endTime) {
      const startTime = new Date(formData.startTime);
      const endTime = new Date(formData.endTime);

      if (endTime <= startTime) {
        newErrors.endTime = 'End time must be after start time';
      }
    }

    if (formData.readinessScore !== undefined && (formData.readinessScore < 0 || formData.readinessScore > 100)) {
      newErrors.readinessScore = 'Readiness score must be between 0 and 100';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof FormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleSave = async () => {
    if (!validateForm() || !session) {
      return;
    }

    try {
      setSaving(true);

      // Calculate duration if both start and end times are provided
      let durationMinutes = undefined;
      if (formData.startTime && formData.endTime) {
        const startTime = new Date(formData.startTime);
        const endTime = new Date(formData.endTime);
        durationMinutes = Math.floor((endTime.getTime() - startTime.getTime()) / (1000 * 60));
      }

      const sessionTopicsPayload = (formData.sessionTopics ?? []).map(detail => ({
        topicId: detail.topicId,
        sequenceOrder: detail.sequenceOrder,
        durationMinutes: detail.durationMinutes,
        trainerId: detail.assignedTrainerId,
        notes: detail.notes?.trim() ? detail.notes.trim() : undefined,
      }));

      const updateData = {
        title: formData.title,
        subtitle: formData.subtitle,
        objective: formData.objective,
        topicIds: formData.topicIds,
        locationId: formData.locationId,
        audienceId: formData.audienceId,
        toneId: formData.toneId,
        status: formData.status,
        readinessScore: formData.readinessScore,
        durationMinutes,
        startTime: formData.startTime ? new Date(formData.startTime) : undefined,
        endTime: formData.endTime ? new Date(formData.endTime) : undefined,
        incentiveIds: formData.incentiveIds,
        sessionTopics: sessionTopicsPayload,
      };

      await sessionService.updateSession(session.id, updateData);
      setHasUnsavedChanges(false);
      navigate('/sessions');
    } catch (error) {
      console.error('Failed to save session:', error);
      setErrors({ submit: 'Failed to save session. Please try again.' });
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (hasUnsavedChanges) {
      const confirmed = window.confirm('You have unsaved changes. Are you sure you want to leave?');
      if (!confirmed) return;
    }
    navigate('/sessions');
  };

  if (loading) {
    return (
      <BuilderLayout title="Edit Session" subtitle="Loading session...">
        <div className="flex items-center justify-center py-12">
          <div className="text-slate-600">Loading session...</div>
        </div>
      </BuilderLayout>
    );
  }

  if (!session) {
    return (
      <BuilderLayout title="Edit Session" subtitle="Session not found">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="text-slate-600 mb-4">Session not found</div>
            <Button onClick={() => navigate('/sessions')}>Back to Sessions</Button>
          </div>
        </div>
      </BuilderLayout>
    );
  }

  return (
    <BuilderLayout
      title="Edit Session"
      subtitle={`Editing: ${session.title}`}
    >
      <div className="max-w-6xl mx-auto space-y-8">
        <Card className="p-8">
          <form className="space-y-8">
            {/* Session Details */}
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-bold text-slate-900">Session Details</h2>
                <div className="h-px bg-slate-200 flex-1"></div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-4">
                  <label htmlFor="title" className="block text-sm font-semibold text-slate-700 mb-2">
                    Session Title *
                  </label>
                  <input
                    type="text"
                    id="title"
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg ${
                      errors.title ? 'border-red-500' : 'border-slate-300'
                    }`}
                    placeholder="Enter session title"
                  />
                  {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title}</p>}
                </div>

                <div className="space-y-4">
                  <label htmlFor="status" className="block text-sm font-semibold text-slate-700 mb-2">
                    Status
                  </label>
                  <select
                    id="status"
                    value={formData.status || SessionStatus.DRAFT}
                    onChange={(e) => handleInputChange('status', e.target.value as SessionStatus)}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg"
                  >
                    <option value={SessionStatus.DRAFT}>Draft</option>
                    <option value={SessionStatus.REVIEW}>Review</option>
                    <option value={SessionStatus.READY}>Ready</option>
                    <option value={SessionStatus.PUBLISHED}>Published</option>
                    <option value={SessionStatus.RETIRED}>Archived</option>
                    <option value={SessionStatus.COMPLETED}>Completed</option>
                    <option value={SessionStatus.CANCELLED}>Cancelled</option>
                  </select>
                </div>

                <div className="lg:col-span-3">
                  <label htmlFor="subtitle" className="block text-sm font-semibold text-slate-700 mb-2">
                    Subtitle
                  </label>
                  <input
                    type="text"
                    id="subtitle"
                    value={formData.subtitle || ''}
                    onChange={(e) => handleInputChange('subtitle', e.target.value)}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter session subtitle (optional)"
                  />
                </div>

                <div className="lg:col-span-3">
                  <label htmlFor="objective" className="block text-sm font-semibold text-slate-700 mb-2">
                    Learning Objective
                  </label>
                  <textarea
                    id="objective"
                    value={formData.objective || ''}
                    onChange={(e) => handleInputChange('objective', e.target.value)}
                    rows={3}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Describe what participants will learn (optional)"
                  />
                </div>
            </div>

            {/* Session Content - Topics */}
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-bold text-slate-900">Session Content</h2>
                <div className="h-px bg-slate-200 flex-1"></div>
              </div>

              {/* Warning message for trainer/topic loading issues */}
              {loadError && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-start">
                    <svg className="w-5 h-5 text-yellow-600 mt-0.5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    <div className="flex-1">
                      <h3 className="text-sm font-medium text-yellow-800 mb-1">Loading Issue</h3>
                      <p className="text-sm text-yellow-700">{loadError}</p>
                      {trainers.length === 0 && (
                        <div className="mt-2 text-xs text-yellow-600">
                          <strong>Tip:</strong> You can still add topics without trainers. Trainer assignments are optional.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* New Session Flow Summary - CENTERPIECE */}
              <SessionFlowSummary
                sessionTitle={formData.title}
                sessionTopics={formData.sessionTopics}
                totalDuration={formData.sessionTopics.reduce((total, topic) => total + (topic.durationMinutes || 30), 0)}
                topics={topics}
                trainers={trainers}
                onAddTopic={() => setIsTopicModalOpen(true)}
                onEditTopic={handleEditTopicDetails}
                onRemoveTopic={handleRemoveTopic}
                onReorder={handleReorderTopics}
              />
            </div>

            {/* Session Logistics */}
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-bold text-slate-900">Session Logistics</h2>
                <div className="h-px bg-slate-200 flex-1"></div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-slate-900">When</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="startTime" className="block text-sm font-medium text-slate-700 mb-2">
                        Start Time
                      </label>
                      <input
                        type="datetime-local"
                        id="startTime"
                        value={formData.startTime || ''}
                        onChange={(e) => handleInputChange('startTime', e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label htmlFor="endTime" className="block text-sm font-medium text-slate-700 mb-2">
                        End Time
                      </label>
                      <input
                        type="datetime-local"
                        id="endTime"
                        value={formData.endTime || ''}
                        onChange={(e) => handleInputChange('endTime', e.target.value)}
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                          errors.endTime ? 'border-red-500' : 'border-slate-300'
                        }`}
                      />
                      {errors.endTime && <p className="mt-1 text-sm text-red-600">{errors.endTime}</p>}
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-slate-900">Where & Who</h3>
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="locationId" className="block text-sm font-medium text-slate-700 mb-2">
                        Location
                      </label>
                      <LocationSelect
                        value={formData.locationId || ''}
                        onChange={(location) => {
                          handleInputChange('locationId', location?.id ?? undefined);
                        }}
                        placeholder="Select a location"
                        required={false}
                      />
                    </div>

                    <div>
                      <label htmlFor="audienceId" className="block text-sm font-medium text-slate-700 mb-2">
                        Target Audience
                      </label>
                      <AudienceSelect
                        value={formData.audienceId || ''}
                        onChange={(audience) => {
                          handleInputChange('audienceId', audience?.id ?? undefined);
                        }}
                        placeholder="Select an audience"
                      />
                    </div>

                    <div>
                      <label htmlFor="toneId" className="block text-sm font-medium text-slate-700 mb-2">
                        Session Tone
                      </label>
                      <ToneSelect
                        value={formData.toneId || ''}
                        onChange={(tone) => {
                          handleInputChange('toneId', tone?.id ?? undefined);
                        }}
                        placeholder="Select a tone"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Session Management */}
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-bold text-slate-900">Session Management</h2>
                <div className="h-px bg-slate-200 flex-1"></div>
              </div>

              <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-slate-900">Session Perks</h3>

                  {/* Current Incentives */}
                  {currentIncentives.length > 0 && (
                    <div className="space-y-3">
                      <h4 className="text-sm font-medium text-slate-700">Currently Attached Incentives:</h4>
                      <div className="space-y-3">
                        {currentIncentives.map(incentive => (
                          <div key={incentive.id} className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
                            <div className="flex-1">
                              <div className="font-semibold text-slate-900">{incentive.title}</div>
                              {incentive.description && (
                                <div className="text-sm text-slate-600 mt-1">{incentive.description}</div>
                              )}
                              <div className="text-xs text-slate-500 mt-1">
                                Status: {incentive.status} |
                                Valid: {new Date(incentive.startDate).toLocaleDateString()} - {new Date(incentive.endDate).toLocaleDateString()}
                              </div>
                            </div>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                const newIncentiveIds = formData.incentiveIds?.filter(id => id !== incentive.id) || [];
                                handleInputChange('incentiveIds', newIncentiveIds);
                                setCurrentIncentives(prev => prev.filter(inc => inc.id !== incentive.id));
                              }}
                            >
                              Remove
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Add Incentive */}
                  <div>
                    <label htmlFor="addIncentive" className="block text-sm font-medium text-slate-700 mb-2">
                      Add Incentive
                    </label>
                    <select
                      id="addIncentive"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      onChange={(e) => {
                        const incentiveId = e.target.value;
                        if (incentiveId && !formData.incentiveIds?.includes(incentiveId)) {
                          const newIncentiveIds = [...(formData.incentiveIds || []), incentiveId];
                          handleInputChange('incentiveIds', newIncentiveIds);

                          const incentive = incentives.find(inc => inc.id === incentiveId);
                          if (incentive) {
                            setCurrentIncentives(prev => [...prev, incentive]);
                          }
                        }
                        e.target.value = '';
                      }}
                    >
                      <option value="">Select an incentive to add</option>
                      {incentives
                        .filter(incentive => !formData.incentiveIds?.includes(incentive.id))
                        .map(incentive => (
                          <option key={incentive.id} value={incentive.id}>
                            {incentive.title}
                            {incentive.description && ` - ${incentive.description}`}
                          </option>
                        ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Session Configuration */}
              <div className="bg-slate-50 rounded-lg p-6 border">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Session Configuration</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="readinessScore" className="block text-sm font-medium text-slate-700 mb-2">
                      Readiness Score (0-100)
                    </label>
                    <input
                      type="number"
                      id="readinessScore"
                      value={formData.readinessScore || 0}
                      onChange={(e) => handleInputChange('readinessScore', e.target.value ? Number(e.target.value) : 0)}
                      min="0"
                      max="100"
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                        errors.readinessScore ? 'border-red-500' : 'border-slate-300'
                      }`}
                    />
                    {errors.readinessScore && <p className="mt-1 text-sm text-red-600">{errors.readinessScore}</p>}
                  </div>
                </div>
              </div>
            </div>

            {/* Error Display */}
            {errors.submit && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{errors.submit}</p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-slate-200">
              <Button
                onClick={handleSave}
                disabled={saving || !hasUnsavedChanges}
                className="w-full sm:w-auto"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
                className="w-full sm:w-auto"
              >
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      </div>

      {/* Topic Selection Modal */}
      <TopicSelectionModal
        isOpen={isTopicModalOpen}
        onClose={() => setIsTopicModalOpen(false)}
        onSelectTopic={(topic) => {
          // Convert Topic to SessionTopicDetail format
          const newTopicDetail: SessionTopicDetail = {
            topicId: topic.id,
            sequenceOrder: formData.sessionTopics.length + 1,
            durationMinutes: 30, // Default duration
            assignedTrainerId: undefined,
            notes: '',
          };

          const updatedTopics = [...formData.sessionTopics, newTopicDetail];
          handleTopicSelectionChange(updatedTopics);
          setIsTopicModalOpen(false);
        }}
        availableTopics={availableTopicsForSelection}
        onTopicCreated={handleTopicCreated}
      />

      {/* Edit Topic Details Modal */}
      <EditTopicDetailsModal
        isOpen={editingTopicId !== null}
        topicDetail={formData.sessionTopics.find(t => t.topicId === editingTopicId) || null}
        topic={topics.find(t => t.id === editingTopicId)}
        trainers={trainers}
        onSave={handleSaveTopicDetails}
        onClose={() => setEditingTopicId(null)}
      />
    </BuilderLayout>
  );
};

export default SessionEditPage;
