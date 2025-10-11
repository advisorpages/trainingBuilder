import React, { useState, useEffect, useMemo } from 'react';
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
  const [topicSearch, setTopicSearch] = useState('');
  const [showCreateTopicForm, setShowCreateTopicForm] = useState(false);
  const [newTopicName, setNewTopicName] = useState('');
  const [newTopicDescription, setNewTopicDescription] = useState('');
  const [creatingTopic, setCreatingTopic] = useState(false);
  const [topicCreationError, setTopicCreationError] = useState<string | null>(null);

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

  const selectedTopics = useMemo(
    () => topics.filter(topic => formData.topicIds.includes(topic.id)),
    [topics, formData.topicIds],
  );

  const filteredTopics = useMemo(() => {
    if (!topicSearch.trim()) {
      return topics;
    }
    const searchValue = topicSearch.trim().toLowerCase();
    return topics.filter(topic => {
      const nameMatch = topic.name.toLowerCase().includes(searchValue);
      const descriptionMatch = topic.description
        ? topic.description.toLowerCase().includes(searchValue)
        : false;
      return nameMatch || descriptionMatch;
    });
  }, [topics, topicSearch]);

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

  const handleToggleTopic = (topicId: number) => {
    setFormData(prev => {
      const alreadySelected = prev.topicIds.includes(topicId);
      const nextTopicIds = alreadySelected
        ? prev.topicIds.filter(id => id !== topicId)
        : [...prev.topicIds, topicId];
      return { ...prev, topicIds: nextTopicIds };
    });
  };

  const handleRemoveTopic = (topicId: number) => {
    setFormData(prev => ({ ...prev, topicIds: prev.topicIds.filter(id => id !== topicId) }));
  };

  const resetTopicCreationForm = () => {
    setNewTopicName('');
    setNewTopicDescription('');
    setTopicCreationError(null);
  };

  const handleToggleTopicCreationForm = () => {
    setShowCreateTopicForm(prev => {
      if (prev) {
        resetTopicCreationForm();
      }
      return !prev;
    });
  };

  const handleCreateTopic = async () => {
    if (!newTopicName.trim()) {
      setTopicCreationError('Topic name is required');
      return;
    }

    try {
      setCreatingTopic(true);
      const createdTopic = await topicService.createTopic({
        name: newTopicName.trim(),
        description: newTopicDescription.trim() || undefined,
      });

      setTopics(prev => [...prev, createdTopic]);
      setFormData(prev => ({ ...prev, topicIds: [...prev.topicIds, createdTopic.id] }));
      resetTopicCreationForm();
      setShowCreateTopicForm(false);
      setTopicSearch('');
    } catch (error) {
      console.error('Failed to create topic:', error);
      setTopicCreationError('Failed to create topic. Please try again.');
    } finally {
      setCreatingTopic(false);
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
      <div className="max-w-4xl mx-auto space-y-6">
        <Card className="p-6">
          <form className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-slate-900">Basic Information</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label htmlFor="title" className="block text-sm font-medium text-slate-700 mb-2">
                    Title *
                  </label>
                  <input
                    type="text"
                    id="title"
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      errors.title ? 'border-red-500' : 'border-slate-300'
                    }`}
                    placeholder="Enter session title"
                  />
                  {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title}</p>}
                </div>

                <div className="md:col-span-2">
                  <label htmlFor="subtitle" className="block text-sm font-medium text-slate-700 mb-2">
                    Subtitle
                  </label>
                  <input
                    type="text"
                    id="subtitle"
                    value={formData.subtitle || ''}
                    onChange={(e) => handleInputChange('subtitle', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter session subtitle (optional)"
                  />
                </div>

                <div className="md:col-span-2">
                  <label htmlFor="objective" className="block text-sm font-medium text-slate-700 mb-2">
                    Objective
                  </label>
                  <textarea
                    id="objective"
                    value={formData.objective || ''}
                    onChange={(e) => handleInputChange('objective', e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Describe the session objective (optional)"
                  />
                </div>
              </div>
            </div>

            {/* Scheduling */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-slate-900">Scheduling</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

            {/* Associations */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-slate-900">Associations</h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Topics
                  </label>
                  <div className="space-y-3">
                    {selectedTopics.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {selectedTopics.map(topic => (
                          <span
                            key={topic.id}
                            className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-sm text-blue-700"
                          >
                            {topic.name}
                            <button
                              type="button"
                              onClick={() => handleRemoveTopic(topic.id)}
                              className="text-blue-600 transition hover:text-blue-800 focus:outline-none"
                              aria-label={`Remove ${topic.name}`}
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-slate-500">No topics selected yet.</p>
                    )}

                    <div className="relative">
                      <input
                        type="text"
                        value={topicSearch}
                        onChange={(e) => setTopicSearch(e.target.value)}
                        placeholder="Search topics by name or description..."
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                      />
                      {topicSearch && (
                        <button
                          type="button"
                          onClick={() => setTopicSearch('')}
                          className="absolute inset-y-0 right-0 px-3 text-slate-400 transition hover:text-slate-600"
                          aria-label="Clear topic search"
                        >
                          ×
                        </button>
                      )}
                    </div>

                    <div className="max-h-56 overflow-y-auto rounded-lg border border-slate-200">
                      {filteredTopics.length > 0 ? (
                        filteredTopics.map(topic => {
                          const isSelected = formData.topicIds.includes(topic.id);
                          return (
                            <label
                              key={topic.id}
                              className={`flex cursor-pointer items-start gap-3 border-b border-slate-100 px-3 py-2 last:border-0 ${
                                isSelected ? 'bg-blue-50' : 'hover:bg-slate-50'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => handleToggleTopic(topic.id)}
                                className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                              />
                              <div>
                                <div className="text-sm font-medium text-slate-900">{topic.name}</div>
                                {topic.description && (
                                  <div className="mt-1 text-xs text-slate-600">{topic.description}</div>
                                )}
                              </div>
                            </label>
                          );
                        })
                      ) : (
                        <div className="px-3 py-4 text-sm text-slate-500">No topics found.</div>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleToggleTopicCreationForm}
                      >
                        {showCreateTopicForm ? 'Cancel' : 'Create Topic'}
                      </Button>
                    </div>

                    {showCreateTopicForm && (
                      <div className="space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-4">
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">
                            Topic Name *
                          </label>
                          <input
                            type="text"
                            value={newTopicName}
                            onChange={(e) => setNewTopicName(e.target.value)}
                            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">
                            Description
                          </label>
                          <textarea
                            value={newTopicDescription}
                            onChange={(e) => setNewTopicDescription(e.target.value)}
                            rows={3}
                            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        {topicCreationError && (
                          <p className="text-sm text-red-600">{topicCreationError}</p>
                        )}
                        <div className="flex flex-wrap gap-2">
                          <Button
                            type="button"
                            onClick={handleCreateTopic}
                            disabled={creatingTopic}
                          >
                            {creatingTopic ? 'Creating...' : 'Save Topic'}
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={handleToggleTopicCreationForm}
                          >
                            Dismiss
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                      Audience
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
                      Tone
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

            {/* Status and Settings */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-slate-900">Status & Settings</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="status" className="block text-sm font-medium text-slate-700 mb-2">
                    Status
                  </label>
                  <select
                    id="status"
                    value={formData.status || SessionStatus.DRAFT}
                    onChange={(e) => handleInputChange('status', e.target.value as SessionStatus)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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

                <div>
                  <label htmlFor="readinessScore" className="block text-sm font-medium text-slate-700 mb-2">
                    Readiness Score
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

            {/* Trainer Assignments */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-slate-900">Trainer Assignments</h3>

              {/* Current Trainers */}
              {currentTrainers.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-slate-700">Currently Assigned Trainers:</h4>
                  <div className="space-y-2">
                    {currentTrainers.map(trainer => (
                      <div key={trainer.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                        <div>
                          <div className="font-medium text-slate-900">{trainer.name}</div>
                          {trainer.expertiseTags && trainer.expertiseTags.length > 0 && (
                            <div className="text-sm text-slate-600">
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
                <div className="flex gap-2">
                  <select
                    id="addTrainer"
                    className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
            </div>

            {/* Incentives */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-slate-900">Incentives</h3>

              {/* Current Incentives */}
              {currentIncentives.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-slate-700">Currently Attached Incentives:</h4>
                  <div className="space-y-2">
                    {currentIncentives.map(incentive => (
                      <div key={incentive.id} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                        <div>
                          <div className="font-medium text-slate-900">{incentive.title}</div>
                          {incentive.description && (
                            <div className="text-sm text-slate-600">{incentive.description}</div>
                          )}
                          <div className="text-xs text-slate-500">
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
                <div className="flex gap-2">
                  <select
                    id="addIncentive"
                    className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
