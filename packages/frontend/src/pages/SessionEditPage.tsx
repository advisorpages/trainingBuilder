import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Session, SessionStatus } from '@leadership-training/shared';
import { sessionService } from '../services/session.service';
import { topicService } from '../services/topic.service';
import { locationService } from '../services/location.service';
import { audienceService } from '../services/audience.service';
import { toneService } from '../services/tone.service';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { BuilderLayout } from '../layouts/BuilderLayout';
import { Topic, Location, Audience, Tone } from '@leadership-training/shared';

interface FormData {
  title: string;
  subtitle?: string;
  objective?: string;
  topicId?: number;
  locationId?: number;
  audienceId?: number;
  toneId?: number;
  startTime?: string;
  endTime?: string;
  status?: SessionStatus;
  readinessScore?: number;
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
        setFormData({
          title: sessionData.title || '',
          subtitle: sessionData.subtitle || '',
          objective: sessionData.objective || '',
          topicId: sessionData.categoryId || undefined,
          locationId: sessionData.locationId || undefined,
          audienceId: sessionData.audienceId || undefined,
          toneId: sessionData.toneId || undefined,
          startTime: sessionData.startTime ? new Date(sessionData.startTime).toISOString().slice(0, 16) : '',
          endTime: sessionData.endTime ? new Date(sessionData.endTime).toISOString().slice(0, 16) : '',
          status: sessionData.status || SessionStatus.DRAFT,
          readinessScore: sessionData.readinessScore || 0,
        });
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
        const [topicsData, locationsData, audiencesData, tonesData] = await Promise.all([
          topicService.getActiveTopics(),
          locationService.getActiveLocations(),
          audienceService.getActiveAudiences(),
          toneService.getActiveTones(),
        ]);

        setTopics(topicsData);
        setLocations(locationsData);
        setAudiences(audiencesData);
        setTones(tonesData);
      } catch (error) {
        console.error('Failed to load dropdown options:', error);
      }
    };

    loadDropdownOptions();
  }, []);

  // Track unsaved changes
  useEffect(() => {
    if (session) {
      const hasChanges =
        formData.title !== (session.title || '') ||
        formData.subtitle !== (session.subtitle || '') ||
        formData.objective !== (session.objective || '') ||
        formData.topicId !== (session.categoryId || undefined) ||
        formData.locationId !== (session.locationId || undefined) ||
        formData.audienceId !== (session.audienceId || undefined) ||
        formData.toneId !== (session.toneId || undefined) ||
        formData.startTime !== (session.startTime ? new Date(session.startTime).toISOString().slice(0, 16) : '') ||
        formData.endTime !== (session.endTime ? new Date(session.endTime).toISOString().slice(0, 16) : '') ||
        formData.status !== (session.status || SessionStatus.DRAFT) ||
        formData.readinessScore !== (session.readinessScore || 0);

      setHasUnsavedChanges(hasChanges);
    }
  }, [formData, session]);

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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="topicId" className="block text-sm font-medium text-slate-700 mb-2">
                    Category
                  </label>
                  <select
                    id="topicId"
                    value={formData.topicId || ''}
                    onChange={(e) => handleInputChange('topicId', e.target.value ? Number(e.target.value) : undefined)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select a topic</option>
                    {topics.map(topic => (
                      <option key={topic.id} value={topic.id}>
                        {topic.name}
                      </option>
                    ))}
                  </select>
                </div>

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