import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BuilderLayout } from '../layouts/BuilderLayout';
import { Button } from '../ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/card';
import { Input } from '../ui/input';
import { Progress } from '../ui/progress';

interface SessionFormData {
  title: string;
  subtitle: string;
  description: string;
  duration: number;
  maxParticipants: number;
  topic: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  format: 'in-person' | 'virtual' | 'hybrid';
  tags: string[];
  objectives: string[];
  outline: {
    section: string;
    duration: number;
    description: string;
  }[];
  materials: string[];
  prerequisites: string[];
  trainerId?: string;
}

interface Topic {
  id: string;
  name: string;
  category: string;
}

interface Trainer {
  id: string;
  name: string;
  specializations: string[];
}

const SessionWorksheetPage: React.FC = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [trainers, setTrainers] = useState<Trainer[]>([]);
  const [formData, setFormData] = useState<SessionFormData>({
    title: '',
    subtitle: '',
    description: '',
    duration: 60,
    maxParticipants: 20,
    topic: '',
    difficulty: 'beginner',
    format: 'in-person',
    tags: [],
    objectives: [''],
    outline: [
      { section: 'Introduction', duration: 10, description: '' },
      { section: 'Main Content', duration: 40, description: '' },
      { section: 'Wrap-up', duration: 10, description: '' }
    ],
    materials: [''],
    prerequisites: [''],
  });

  const totalSteps = 5;
  const progress = (currentStep / totalSteps) * 100;

  useEffect(() => {
    // Mock data - replace with actual API calls
    setTopics([
      { id: '1', name: 'Leadership Fundamentals', category: 'Leadership' },
      { id: '2', name: 'Effective Communication', category: 'Communication' },
      { id: '3', name: 'Team Building', category: 'Team Management' },
      { id: '4', name: 'Strategic Planning', category: 'Strategy' },
    ]);

    setTrainers([
      { id: '1', name: 'Sarah Johnson', specializations: ['Leadership', 'Communication'] },
      { id: '2', name: 'Mike Chen', specializations: ['Team Management', 'Strategy'] },
      { id: '3', name: 'Lisa Rodriguez', specializations: ['Leadership', 'Strategy'] },
    ]);
  }, []);

  const updateFormData = (field: keyof SessionFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const addArrayItem = (field: 'objectives' | 'materials' | 'prerequisites') => {
    setFormData(prev => ({
      ...prev,
      [field]: [...prev[field], '']
    }));
  };

  const updateArrayItem = (field: 'objectives' | 'materials' | 'prerequisites', index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].map((item, i) => i === index ? value : item)
    }));
  };

  const removeArrayItem = (field: 'objectives' | 'materials' | 'prerequisites', index: number) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index)
    }));
  };

  const updateOutlineItem = (index: number, field: 'section' | 'duration' | 'description', value: string | number) => {
    setFormData(prev => ({
      ...prev,
      outline: prev.outline.map((item, i) => i === index ? { ...item, [field]: value } : item)
    }));
  };

  const addOutlineItem = () => {
    setFormData(prev => ({
      ...prev,
      outline: [...prev.outline, { section: '', duration: 15, description: '' }]
    }));
  };

  const removeOutlineItem = (index: number) => {
    if (formData.outline.length > 1) {
      setFormData(prev => ({
        ...prev,
        outline: prev.outline.filter((_, i) => i !== index)
      }));
    }
  };

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      // Mock API call - replace with actual session creation
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Navigate to session builder for further editing
      navigate('/sessions/builder/new', {
        state: { sessionData: formData }
      });
    } catch (error) {
      console.error('Error creating session:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>Define the core details of your training session</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Session Title *
                </label>
                <Input
                  value={formData.title}
                  onChange={(e) => updateFormData('title', e.target.value)}
                  placeholder="e.g., Leadership Fundamentals for New Managers"
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Subtitle
                </label>
                <Input
                  value={formData.subtitle}
                  onChange={(e) => updateFormData('subtitle', e.target.value)}
                  placeholder="Brief subtitle or tagline"
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Description *
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => updateFormData('description', e.target.value)}
                  placeholder="Provide a detailed description of what participants will learn..."
                  className="w-full min-h-[100px] px-3 py-2 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Duration (minutes) *
                  </label>
                  <Input
                    type="number"
                    value={formData.duration}
                    onChange={(e) => updateFormData('duration', parseInt(e.target.value) || 60)}
                    min="15"
                    max="480"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Max Participants *
                  </label>
                  <Input
                    type="number"
                    value={formData.maxParticipants}
                    onChange={(e) => updateFormData('maxParticipants', parseInt(e.target.value) || 20)}
                    min="1"
                    max="100"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        );

      case 2:
        return (
          <Card>
            <CardHeader>
              <CardTitle>Session Configuration</CardTitle>
              <CardDescription>Set the format, difficulty, and topic for your session</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Topic *
                </label>
                <select
                  value={formData.topic}
                  onChange={(e) => updateFormData('topic', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select a topic...</option>
                  {topics.map(topic => (
                    <option key={topic.id} value={topic.id}>{topic.name} ({topic.category})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Difficulty Level *
                </label>
                <div className="flex gap-4">
                  {(['beginner', 'intermediate', 'advanced'] as const).map(level => (
                    <label key={level} className="flex items-center">
                      <input
                        type="radio"
                        name="difficulty"
                        value={level}
                        checked={formData.difficulty === level}
                        onChange={(e) => updateFormData('difficulty', e.target.value)}
                        className="mr-2"
                      />
                      <span className="text-sm capitalize">{level}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Session Format *
                </label>
                <div className="flex gap-4">
                  {(['in-person', 'virtual', 'hybrid'] as const).map(format => (
                    <label key={format} className="flex items-center">
                      <input
                        type="radio"
                        name="format"
                        value={format}
                        checked={formData.format === format}
                        onChange={(e) => updateFormData('format', e.target.value)}
                        className="mr-2"
                      />
                      <span className="text-sm capitalize">{format.replace('-', ' ')}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Tags (comma-separated)
                </label>
                <Input
                  value={formData.tags.join(', ')}
                  onChange={(e) => updateFormData('tags', e.target.value.split(',').map(tag => tag.trim()).filter(Boolean))}
                  placeholder="e.g., leadership, communication, management"
                />
              </div>
            </CardContent>
          </Card>
        );

      case 3:
        return (
          <Card>
            <CardHeader>
              <CardTitle>Learning Objectives</CardTitle>
              <CardDescription>Define what participants will achieve</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {formData.objectives.map((objective, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    value={objective}
                    onChange={(e) => updateArrayItem('objectives', index, e.target.value)}
                    placeholder={`Learning objective ${index + 1}...`}
                    className="flex-1"
                  />
                  {formData.objectives.length > 1 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removeArrayItem('objectives', index)}
                    >
                      Remove
                    </Button>
                  )}
                </div>
              ))}
              <Button variant="outline" onClick={() => addArrayItem('objectives')}>
                Add Objective
              </Button>
            </CardContent>
          </Card>
        );

      case 4:
        return (
          <Card>
            <CardHeader>
              <CardTitle>Session Outline</CardTitle>
              <CardDescription>Structure your session with timing</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {formData.outline.map((item, index) => (
                <div key={index} className="p-4 border border-slate-200 rounded-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-slate-900">Section {index + 1}</h4>
                    {formData.outline.length > 1 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeOutlineItem(index)}
                        className="text-red-600 hover:text-red-700"
                      >
                        Remove
                      </Button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <Input
                      value={item.section}
                      onChange={(e) => updateOutlineItem(index, 'section', e.target.value)}
                      placeholder="Section name"
                    />
                    <Input
                      type="number"
                      value={item.duration}
                      onChange={(e) => updateOutlineItem(index, 'duration', parseInt(e.target.value) || 0)}
                      placeholder="Duration (min)"
                      min="1"
                    />
                    <Input
                      value={item.description}
                      onChange={(e) => updateOutlineItem(index, 'description', e.target.value)}
                      placeholder="Brief description"
                    />
                  </div>
                </div>
              ))}

              <div className="flex justify-between items-center">
                <Button variant="outline" onClick={addOutlineItem}>
                  Add Section
                </Button>
                <div className="text-sm text-slate-600">
                  Total: {formData.outline.reduce((sum, item) => sum + item.duration, 0)} minutes
                </div>
              </div>
            </CardContent>
          </Card>
        );

      case 5:
        return (
          <Card>
            <CardHeader>
              <CardTitle>Materials & Prerequisites</CardTitle>
              <CardDescription>Specify what participants need</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h4 className="font-medium text-slate-900 mb-3">Materials Needed</h4>
                {formData.materials.map((material, index) => (
                  <div key={index} className="flex gap-2 mb-2">
                    <Input
                      value={material}
                      onChange={(e) => updateArrayItem('materials', index, e.target.value)}
                      placeholder="e.g., Notebook, laptop, handouts"
                      className="flex-1"
                    />
                    {formData.materials.length > 1 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removeArrayItem('materials', index)}
                      >
                        Remove
                      </Button>
                    )}
                  </div>
                ))}
                <Button variant="outline" onClick={() => addArrayItem('materials')}>
                  Add Material
                </Button>
              </div>

              <div>
                <h4 className="font-medium text-slate-900 mb-3">Prerequisites</h4>
                {formData.prerequisites.map((prereq, index) => (
                  <div key={index} className="flex gap-2 mb-2">
                    <Input
                      value={prereq}
                      onChange={(e) => updateArrayItem('prerequisites', index, e.target.value)}
                      placeholder="e.g., Basic management experience"
                      className="flex-1"
                    />
                    {formData.prerequisites.length > 1 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removeArrayItem('prerequisites', index)}
                      >
                        Remove
                      </Button>
                    )}
                  </div>
                ))}
                <Button variant="outline" onClick={() => addArrayItem('prerequisites')}>
                  Add Prerequisite
                </Button>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Assign Trainer (Optional)
                </label>
                <select
                  value={formData.trainerId || ''}
                  onChange={(e) => updateFormData('trainerId', e.target.value || undefined)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Assign later...</option>
                  {trainers.map(trainer => (
                    <option key={trainer.id} value={trainer.id}>
                      {trainer.name} - {trainer.specializations.join(', ')}
                    </option>
                  ))}
                </select>
              </div>
            </CardContent>
          </Card>
        );

      default:
        return null;
    }
  };

  return (
    <BuilderLayout
      title="Session Worksheet"
      subtitle="Create a new training session step by step"
      statusSlot={
        <div className="flex items-center space-x-4">
          <div className="hidden sm:block text-sm text-slate-600">
            Step {currentStep} of {totalSteps}
          </div>
          <div className="w-20">
            <Progress value={progress} />
          </div>
        </div>
      }
    >
      <div className="max-w-4xl space-y-6">
        {/* Progress Indicator */}
        <div className="flex items-center justify-center space-x-4 sm:hidden">
          <div className="text-sm text-slate-600">
            Step {currentStep} of {totalSteps}
          </div>
        </div>

        {/* Step Content */}
        <div className="min-h-[500px]">
          {renderStep()}
        </div>

        {/* Navigation */}
        <div className="flex justify-between items-center pt-6 border-t border-slate-200">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentStep === 1}
          >
            Previous
          </Button>

          <div className="flex space-x-2">
            <Button
              variant="ghost"
              onClick={() => navigate('/sessions')}
            >
              Cancel
            </Button>

            {currentStep < totalSteps ? (
              <Button
                onClick={handleNext}
                disabled={
                  (currentStep === 1 && (!formData.title || !formData.description)) ||
                  (currentStep === 2 && (!formData.topic))
                }
              >
                Next
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={loading}
              >
                {loading ? 'Creating...' : 'Create Session'}
              </Button>
            )}
          </div>
        </div>
      </div>
    </BuilderLayout>
  );
};

export default SessionWorksheetPage;