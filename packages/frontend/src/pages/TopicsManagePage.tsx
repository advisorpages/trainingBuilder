import React, { useState, useEffect } from 'react';
import { BuilderLayout } from '../layouts/BuilderLayout';
import { Button } from '../ui/button';
import { Card } from '../ui/card';

interface Topic {
  id: string;
  name: string;
  description?: string;
  tags?: string[];
  sessionCount?: number;
  createdAt: string;
  updatedAt: string;
}

interface TopicFormData {
  name: string;
  description: string;
  tags: string;
}

const TopicForm: React.FC<{
  topic?: Topic;
  onSubmit: (data: TopicFormData) => void;
  onCancel: () => void;
  isSubmitting: boolean;
}> = ({ topic, onSubmit, onCancel, isSubmitting }) => {
  const [formData, setFormData] = useState<TopicFormData>({
    name: topic?.name || '',
    description: topic?.description || '',
    tags: topic?.tags?.join(', ') || '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <Card className="p-6">
      <h2 className="text-lg font-semibold mb-4">
        {topic ? 'Edit Topic' : 'Create New Topic'}
      </h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Name *
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full rounded-lg border-slate-300"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Description
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={3}
            className="w-full rounded-lg border-slate-300"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Tags (comma-separated)
          </label>
          <input
            type="text"
            value={formData.tags}
            onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
            className="w-full rounded-lg border-slate-300"
            placeholder="e.g., leadership, communication, management"
          />
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting || !formData.name.trim()}>
            {isSubmitting ? 'Saving...' : topic ? 'Update' : 'Create'}
          </Button>
        </div>
      </form>
    </Card>
  );
};

const TopicsTable: React.FC<{
  topics: Topic[];
  onEdit: (topic: Topic) => void;
  onDelete: (topic: Topic) => void;
  onViewSessions: (topic: Topic) => void;
}> = ({ topics, onEdit, onDelete, onViewSessions }) => {
  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
      <table className="min-w-full divide-y divide-slate-200">
        <thead className="bg-slate-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
              Name
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
              Description
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
              Tags
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
              Sessions Using
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-slate-500">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200 bg-white">
          {topics.map((topic) => (
            <tr key={topic.id} className="hover:bg-slate-50">
              <td className="px-6 py-4">
                <div className="text-sm font-medium text-slate-900">{topic.name}</div>
              </td>
              <td className="px-6 py-4">
                <div className="text-sm text-slate-500">
                  {topic.description || '—'}
                </div>
              </td>
              <td className="px-6 py-4">
                <div className="text-sm text-slate-500">
                  {topic.tags?.length ? (
                    <div className="flex flex-wrap gap-1">
                      {topic.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-slate-100 text-slate-700"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  ) : (
                    '—'
                  )}
                </div>
              </td>
              <td className="px-6 py-4">
                <div className="text-sm text-slate-900">
                  {topic.sessionCount ? (
                    <button
                      onClick={() => onViewSessions(topic)}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      {topic.sessionCount} session{topic.sessionCount > 1 ? 's' : ''}
                    </button>
                  ) : (
                    '0 sessions'
                  )}
                </div>
              </td>
              <td className="px-6 py-4 text-right text-sm space-x-2">
                <Button variant="outline" size="sm" onClick={() => onEdit(topic)}>
                  Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onDelete(topic)}
                  disabled={!!topic.sessionCount && topic.sessionCount > 0}
                >
                  Delete
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export const TopicsManagePage: React.FC = () => {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingTopic, setEditingTopic] = useState<Topic | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTopics();
  }, []);

  const fetchTopics = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/topics');
      if (!response.ok) throw new Error('Failed to fetch topics');
      const data = await response.json();
      setTopics(data);
    } catch (error) {
      console.error('Failed to fetch topics:', error);
      setError('Failed to load topics');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTopic = async (formData: TopicFormData) => {
    try {
      setIsSubmitting(true);
      const response = await fetch('/api/topics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error('Failed to create topic');

      await fetchTopics();
      setShowForm(false);
    } catch (error) {
      console.error('Failed to create topic:', error);
      setError('Failed to create topic');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateTopic = async (formData: TopicFormData) => {
    if (!editingTopic) return;

    try {
      setIsSubmitting(true);
      const response = await fetch(`/api/topics/${editingTopic.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error('Failed to update topic');

      await fetchTopics();
      setEditingTopic(null);
    } catch (error) {
      console.error('Failed to update topic:', error);
      setError('Failed to update topic');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteTopic = async (topic: Topic) => {
    if (topic.sessionCount && topic.sessionCount > 0) {
      setError(`Cannot delete "${topic.name}" - it's used by ${topic.sessionCount} session(s)`);
      return;
    }

    if (!confirm(`Are you sure you want to delete the topic "${topic.name}"?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/topics/${topic.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete topic');
      }

      const result = await response.json();
      if (!result.deleted) {
        setError(result.message || 'Failed to delete topic');
        return;
      }

      await fetchTopics();
    } catch (error) {
      console.error('Failed to delete topic:', error);
      setError('Failed to delete topic');
    }
  };

  const handleViewSessions = (topic: Topic) => {
    // Navigate to sessions page with topic filter
    window.location.href = `/sessions?topicId=${topic.id}`;
  };

  const handleEdit = (topic: Topic) => {
    setEditingTopic(topic);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingTopic(null);
    setError(null);
  };

  if (loading) {
    return (
      <BuilderLayout title="Topics" subtitle="Loading topics...">
        <div className="flex items-center justify-center py-12">
          <div className="text-slate-600">Loading...</div>
        </div>
      </BuilderLayout>
    );
  }

  return (
    <BuilderLayout
      title="Topics"
      subtitle={`${topics.length} topics available`}
    >
      <div className="space-y-6">
        {/* Error Message */}
        {error && (
          <Card className="p-4 border-red-200 bg-red-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="text-red-600 text-sm">{error}</div>
              </div>
              <Button variant="outline" size="sm" onClick={() => setError(null)}>
                Dismiss
              </Button>
            </div>
          </Card>
        )}

        {/* Controls */}
        {!showForm && !editingTopic && (
          <div className="flex justify-between items-center">
            <div className="text-sm text-slate-600">
              Manage topics used by the AI Session Builder
            </div>
            <Button onClick={() => setShowForm(true)}>
              New Topic
            </Button>
          </div>
        )}

        {/* Create Form */}
        {showForm && (
          <TopicForm
            onSubmit={handleCreateTopic}
            onCancel={handleCancel}
            isSubmitting={isSubmitting}
          />
        )}

        {/* Edit Form */}
        {editingTopic && (
          <TopicForm
            topic={editingTopic}
            onSubmit={handleUpdateTopic}
            onCancel={handleCancel}
            isSubmitting={isSubmitting}
          />
        )}

        {/* Topics Table */}
        {!showForm && !editingTopic && (
          <TopicsTable
            topics={topics}
            onEdit={handleEdit}
            onDelete={handleDeleteTopic}
            onViewSessions={handleViewSessions}
          />
        )}

        {topics.length === 0 && !showForm && (
          <div className="text-center py-12">
            <div className="text-slate-500 mb-4">No topics found</div>
            <Button onClick={() => setShowForm(true)}>Create Your First Topic</Button>
          </div>
        )}
      </div>
    </BuilderLayout>
  );
};

export default TopicsManagePage;