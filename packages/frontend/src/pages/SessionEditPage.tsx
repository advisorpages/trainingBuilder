import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Session, SessionStatus, Trainer, Incentive } from '@leadership-training/shared';
import { sessionService } from '../services/session.service';
import { topicService } from '../services/topic.service';
import { locationService } from '../services/location.service';
import { audienceService } from '../services/audience.service';
import { toneService } from '../services/tone.service';
import { trainerService } from '../services/trainer.service';
import { incentiveService } from '../services/incentive.service';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { BuilderLayout } from '../layouts/BuilderLayout';
import { Topic, Location, Audience, Tone } from '@leadership-training/shared';
import { EnhancedTopicSelection } from '../components/sessions/EnhancedTopicSelection';
import { SessionTopicDetail } from '../components/sessions/EnhancedTopicCard';

interface FormData {
  title: string;
  subtitle?: string;
  objective?: string;
  topicIds: number[];
  locationId?: number;
  audienceId?: number;
  toneId?: number;
  startTime?: string;
  endTime?: string;
  status?: SessionStatus;
  readinessScore?: number;
  incentiveIds?: string[];
  trainerIds?: number[];
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
    status: SessionStatus.DRAFT,
    readinessScore: 0,
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Dropdown options
  const [topics, setTopics] = useState<Topic[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [audiences, setAudiences] = useState<Audience[]>([]);
  const [tones, setTones] = useState<Tone[]>([]);
  const [trainers, setTrainers] = useState<Trainer[]>([]);
  const [incentives, setIncentives] = useState<Incentive[]>([]);

  // Current associations
  const [currentTrainers, setCurrentTrainers] = useState<Trainer[]>([]);
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
        setSession(sessionData);
        const sessionWithRelations = sessionData as Session & {
          incentives?: Incentive[];
          trainerAssignments?: Array<{ trainer: Trainer }>;
          topics?: Topic[];
        };

        setFormData({
          title: sessionData.title || '',
          subtitle: sessionData.subtitle || '',
          objective: sessionData.objective || '',
          topicIds: sessionWithRelations.topics?.map(topic => topic.id) || [],
          locationId: sessionData.locationId || undefined,
          audienceId: sessionData.audienceId || undefined,
          toneId: sessionData.toneId || undefined,
          startTime: sessionData.startTime ? new Date(sessionData.startTime).toISOString().slice(0, 16) : '',
          endTime: sessionData.endTime ? new Date(sessionData.endTime).toISOString().slice(0, 16) : '',
          status: sessionData.status || SessionStatus.DRAFT,
          readinessScore: sessionData.readinessScore || 0,
          incentiveIds: sessionWithRelations.incentives?.map(inc => inc.id) || [],
          trainerIds: sessionWithRelations.trainerAssignments?.map(ta => ta.trainer.id) || [],
        });

        // Set current associations for display
        setCurrentTrainers(sessionWithRelations.trainerAssignments?.map(ta => ta.trainer) || []);
        setCurrentIncentives(sessionWithRelations.incentives || []);
      } catch (error) {
        console.error('Failed to load session:', error);
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
        const [topicsData, locationsData, audiencesData, tonesData, trainersData, incentivesData] = await Promise.all([
          topicService.getActiveTopics(),
          locationService.getActiveLocations(),
          audienceService.getActiveAudiences(),
          toneService.getActiveTones(),
          trainerService.getActiveTrainers(),
          incentiveService.getIncentives(),
        ]);

        setTopics(topicsData);
        setLocations(locationsData);
        setAudiences(audiencesData);
        setTones(tonesData);
        setTrainers(trainersData);
        setIncentives(incentivesData);
      } catch (error) {
        console.error('Failed to load dropdown options:', error);
      }
    };

    loadDropdownOptions();
  }, []);

  // Track unsaved changes
  useEffect(() => {
    if (session) {
      const sessionWithRelations = session as Session & {
        incentives?: Incentive[];
        trainerAssignments?: Array<{ trainer: Trainer }>;
        topics?: Topic[];
      };

      const originalTopicIds = sessionWithRelations.topics
        ? sessionWithRelations.topics.map(topic => topic.id).sort((a, b) => a - b)
        : [];
      const currentTopicIds = [...(formData.topicIds || [])].sort((a, b) => a - b);

      const originalIncentiveIds = sessionWithRelations.incentives
        ? sessionWithRelations.incentives.map(inc => inc.id).sort()
        : [];
      const currentIncentiveIds = (formData.incentiveIds ?? []).slice().sort();

      const originalTrainerIds = sessionWithRelations.trainerAssignments
        ? sessionWithRelations.trainerAssignments.map(ta => ta.trainer.id).sort((a, b) => a - b)
        : [];
      const currentTrainerIds = (formData.trainerIds ?? []).slice().sort((a, b) => a - b);

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
        JSON.stringify(currentTrainerIds) !== JSON.stringify(originalTrainerIds);

      setHasUnsavedChanges(hasChanges);
    }
  }, [formData, session]);

  useEffect(() => {
    const sessionTopics = session?.topics ?? [];
    if (sessionTopics.length > 0) {
      setTopics(prev => {
        const existingIds = new Set(prev.map(topic => topic.id));
        const additionalTopics = sessionTopics.filter(topic => !existingIds.has(topic.id));
        return additionalTopics.length > 0 ? [...prev, ...additionalTopics] : prev;
      });
    }
  }, [session]);

  const sortedTopics = useMemo(() => {
    const topicsCopy = [...topics];
    topicsCopy.sort((a, b) => {
      const aUpdated = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
      const bUpdated = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
      return bUpdated - aUpdated;
    });
    return topicsCopy;
  }, [topics]);

  const handleTopicSelectionChange = useCallback((details: SessionTopicDetail[]) => {
    const orderedTopicIds = [...details]
      .sort((a, b) => a.sequenceOrder - b.sequenceOrder)
      .map(detail => detail.topicId);

    setFormData(prev => ({
      ...prev,
      topicIds: orderedTopicIds,
    }));
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

      const updateData = {
        ...formData,
        durationMinutes,
        startTime: formData.startTime ? new Date(formData.startTime) : undefined,
        endTime: formData.endTime ? new Date(formData.endTime) : undefined,
        incentiveIds: formData.incentiveIds,
        trainerIds: formData.trainerIds,
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
            </div>

            {/* Session Content - Topics */}
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-bold text-slate-900">Session Content</h2>
                <div className="h-px bg-slate-200 flex-1"></div>
              </div>

              <EnhancedTopicSelection
                topics={sortedTopics}
                trainers={trainers}
                initialSelectedTopics={formData.topicIds}
                onSelectionChange={handleTopicSelectionChange}
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
                      <select
                        id="locationId"
                        value={formData.locationId || ''}
                        onChange={(e) => handleInputChange('locationId', e.target.value ? Number(e.target.value) : undefined)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">Select a location</option>
                        {locations.map(location => (
                          <option key={location.id} value={location.id}>
                            {location.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label htmlFor="audienceId" className="block text-sm font-medium text-slate-700 mb-2">
                        Target Audience
                      </label>
                      <select
                        id="audienceId"
                        value={formData.audienceId || ''}
                        onChange={(e) => handleInputChange('audienceId', e.target.value ? Number(e.target.value) : undefined)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">Select an audience</option>
                        {audiences.map(audience => (
                          <option key={audience.id} value={audience.id}>
                            {audience.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label htmlFor="toneId" className="block text-sm font-medium text-slate-700 mb-2">
                        Session Tone
                      </label>
                      <select
                        id="toneId"
                        value={formData.toneId || ''}
                        onChange={(e) => handleInputChange('toneId', e.target.value ? Number(e.target.value) : undefined)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">Select a tone</option>
                        {tones.map(tone => (
                          <option key={tone.id} value={tone.id}>
                            {tone.name}
                          </option>
                        ))}
                      </select>
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

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Training Team */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-slate-900">Training Team</h3>

                  {/* Current Trainers */}
                  {currentTrainers.length > 0 && (
                    <div className="space-y-3">
                      <h4 className="text-sm font-medium text-slate-700">Currently Assigned Trainers:</h4>
                      <div className="space-y-3">
                        {currentTrainers.map(trainer => (
                          <div key={trainer.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border">
                            <div className="flex-1">
                              <div className="font-semibold text-slate-900">{trainer.name}</div>
                              {trainer.expertiseTags && trainer.expertiseTags.length > 0 && (
                                <div className="text-sm text-slate-600 mt-1">
                                  Expertise: {trainer.expertiseTags.join(', ')}
                                </div>
                              )}
                            </div>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                const newTrainerIds = formData.trainerIds?.filter(id => id !== trainer.id) || [];
                                handleInputChange('trainerIds', newTrainerIds);
                                setCurrentTrainers(prev => prev.filter(t => t.id !== trainer.id));
                              }}
                            >
                              Remove
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Add Trainer */}
                  <div>
                    <label htmlFor="addTrainer" className="block text-sm font-medium text-slate-700 mb-2">
                      Add Trainer
                    </label>
                    <select
                      id="addTrainer"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      onChange={(e) => {
                        const trainerId = Number(e.target.value);
                        if (trainerId && !formData.trainerIds?.includes(trainerId)) {
                          const newTrainerIds = [...(formData.trainerIds || []), trainerId];
                          handleInputChange('trainerIds', newTrainerIds);

                          const trainer = trainers.find(t => t.id === trainerId);
                          if (trainer) {
                            setCurrentTrainers(prev => [...prev, trainer]);
                          }
                        }
                        e.target.value = '';
                      }}
                    >
                      <option value="">Select a trainer to add</option>
                      {trainers
                        .filter(trainer => !formData.trainerIds?.includes(trainer.id))
                        .map(trainer => (
                          <option key={trainer.id} value={trainer.id}>
                            {trainer.name}
                            {trainer.expertiseTags && trainer.expertiseTags.length > 0 &&
                              ` (${trainer.expertiseTags.join(', ')})`
                            }
                          </option>
                        ))}
                    </select>
                  </div>
                </div>

                {/* Session Perks */}
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
    </BuilderLayout>
  );
};

export default SessionEditPage;
