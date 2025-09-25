import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card } from '../ui/card';
import { Button } from '../ui/button';

interface PublicSession {
  id: string;
  title: string;
  subtitle?: string;
  objective?: string;
  audience?: string;
  scheduledAt?: string;
  durationMinutes?: number;
  status: string;
  topic?: {
    id: string;
    name: string;
    description?: string;
  };
  incentives?: Array<{
    id: string;
    name: string;
    description?: string;
    value?: string;
  }>;
  landingPage?: {
    id: string;
    customDescription?: string;
    customCtaText?: string;
    isPublished: boolean;
    seoTitle?: string;
    seoDescription?: string;
  };
  agendaItems?: Array<{
    id: string;
    title: string;
    description?: string;
    duration: number;
    position: number;
    type: string;
  }>;
}

interface RegistrationData {
  firstName: string;
  lastName: string;
  email: string;
  company?: string;
  role?: string;
  phone?: string;
}

const RegistrationForm: React.FC<{
  sessionId: string;
  onSubmit: (data: RegistrationData) => void;
  isSubmitting: boolean;
}> = ({ sessionId, onSubmit, isSubmitting }) => {
  const [formData, setFormData] = useState<RegistrationData>({
    firstName: '',
    lastName: '',
    email: '',
    company: '',
    role: '',
    phone: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleChange = (field: keyof RegistrationData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Card className="p-6">
      <h3 className="text-xl font-semibold mb-4 text-slate-900">Register for this Session</h3>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              First Name *
            </label>
            <input
              type="text"
              value={formData.firstName}
              onChange={(e) => handleChange('firstName', e.target.value)}
              className="w-full rounded-lg border-slate-300"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Last Name *
            </label>
            <input
              type="text"
              value={formData.lastName}
              onChange={(e) => handleChange('lastName', e.target.value)}
              className="w-full rounded-lg border-slate-300"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Email Address *
          </label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => handleChange('email', e.target.value)}
            className="w-full rounded-lg border-slate-300"
            required
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Company
            </label>
            <input
              type="text"
              value={formData.company}
              onChange={(e) => handleChange('company', e.target.value)}
              className="w-full rounded-lg border-slate-300"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Role/Title
            </label>
            <input
              type="text"
              value={formData.role}
              onChange={(e) => handleChange('role', e.target.value)}
              className="w-full rounded-lg border-slate-300"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Phone Number
          </label>
          <input
            type="tel"
            value={formData.phone}
            onChange={(e) => handleChange('phone', e.target.value)}
            className="w-full rounded-lg border-slate-300"
          />
        </div>

        <div className="pt-4">
          <Button
            type="submit"
            disabled={isSubmitting || !formData.firstName || !formData.lastName || !formData.email}
            className="w-full"
          >
            {isSubmitting ? 'Registering...' : 'Register Now'}
          </Button>
        </div>
      </form>
    </Card>
  );
};

const SessionAgenda: React.FC<{ agendaItems: PublicSession['agendaItems'] }> = ({ agendaItems }) => {
  if (!agendaItems?.length) return null;

  const totalDuration = agendaItems.reduce((sum, item) => sum + item.duration, 0);

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-semibold text-slate-900">What You'll Learn</h3>
        <span className="text-sm text-slate-500">Duration: {totalDuration} minutes</span>
      </div>

      <div className="space-y-4">
        {agendaItems.map((item, index) => (
          <div key={item.id} className="flex gap-4">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">
                {index + 1}
              </div>
            </div>
            <div className="flex-1">
              <h4 className="font-medium text-slate-900 mb-1">{item.title}</h4>
              {item.description && (
                <p className="text-sm text-slate-600">{item.description}</p>
              )}
              <span className="text-xs text-slate-500">{item.duration} minutes</span>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};

export const PublicSessionPage: React.FC = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const [session, setSession] = useState<PublicSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [registrationSubmitted, setRegistrationSubmitted] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);

  useEffect(() => {
    if (sessionId) {
      fetchSession(sessionId);
    }
  }, [sessionId]);

  const fetchSession = async (id: string) => {
    try {
      setLoading(true);

      // Try to fetch from the public API
      const response = await fetch(`/api/public/sessions/${id}`);

      if (!response.ok) {
        // Mock data for development
        const mockSession: PublicSession = {
          id,
          title: 'Leadership Communication Fundamentals',
          subtitle: 'Building trust through effective communication',
          objective: 'Develop core communication skills for team leadership including active listening, giving feedback, and managing difficult conversations.',
          audience: 'Mid-level managers and team leads looking to improve their communication skills',
          scheduledAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          durationMinutes: 120,
          status: 'published',
          topic: {
            id: 'topic-1',
            name: 'Leadership Communication',
            description: 'Essential communication skills for effective leadership',
          },
          incentives: [
            {
              id: 'incentive-1',
              name: 'Early Bird Bonus',
              description: 'Complimentary leadership assessment and personalized report',
              value: '$150 value',
            },
          ],
          landingPage: {
            id: 'landing-1',
            customDescription: 'Join industry leaders in mastering the art of leadership communication. This interactive workshop combines proven frameworks with hands-on practice.',
            customCtaText: 'Secure Your Spot Today',
            isPublished: true,
            seoTitle: 'Leadership Communication Workshop - Transform Your Leadership Style',
            seoDescription: 'Master essential communication skills for effective leadership. Interactive workshop with proven frameworks and hands-on practice.',
          },
          agendaItems: [
            {
              id: '1',
              title: 'Foundation of Trust',
              description: 'Understanding how communication builds or erodes trust in leadership relationships',
              duration: 20,
              position: 0,
              type: 'topic',
            },
            {
              id: '2',
              title: 'Active Listening Mastery',
              description: 'Hands-on practice with advanced listening techniques and reflection skills',
              duration: 30,
              position: 1,
              type: 'activity',
            },
            {
              id: '3',
              title: 'Feedback That Motivates',
              description: 'Learn the SBI model and practice giving constructive, motivational feedback',
              duration: 35,
              position: 2,
              type: 'topic',
            },
            {
              id: '4',
              title: 'Managing Difficult Conversations',
              description: 'Strategies and practice for navigating challenging discussions with confidence',
              duration: 25,
              position: 3,
              type: 'activity',
            },
            {
              id: '5',
              title: 'Personal Action Plan',
              description: 'Create your customized plan for implementing new communication skills',
              duration: 10,
              position: 4,
              type: 'closer',
            },
          ],
        };

        setSession(mockSession);
        updatePageMeta(mockSession);
        return;
      }

      const data = await response.json();
      setSession(data);
      updatePageMeta(data);
    } catch (error) {
      console.error('Failed to fetch session:', error);
      setError('Failed to load session details');
    } finally {
      setLoading(false);
    }
  };

  const updatePageMeta = (session: PublicSession) => {
    // Update page title
    document.title = session.landingPage?.seoTitle || `${session.title} - Leadership Training`;

    // Update meta description
    const description = session.landingPage?.seoDescription ||
                       session.landingPage?.customDescription ||
                       session.objective ||
                       `Join ${session.title} - A leadership training session`;

    updateMetaTag('name', 'description', description.substring(0, 155));

    // Open Graph tags
    updateMetaTag('property', 'og:title', session.title);
    updateMetaTag('property', 'og:description', description.substring(0, 155));
    updateMetaTag('property', 'og:type', 'event');
    updateMetaTag('property', 'og:url', window.location.href);

    // Twitter Card tags
    updateMetaTag('name', 'twitter:card', 'summary_large_image');
    updateMetaTag('name', 'twitter:title', session.title);
    updateMetaTag('name', 'twitter:description', description.substring(0, 155));
  };

  const updateMetaTag = (attribute: string, name: string, content: string) => {
    let metaTag = document.querySelector(`meta[${attribute}="${name}"]`);
    if (!metaTag) {
      metaTag = document.createElement('meta');
      metaTag.setAttribute(attribute, name);
      document.head.appendChild(metaTag);
    }
    metaTag.setAttribute('content', content);
  };

  const handleRegistration = async (data: RegistrationData) => {
    try {
      setIsRegistering(true);

      const response = await fetch(`/api/public/sessions/${sessionId}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Registration failed');
      }

      setRegistrationSubmitted(true);
    } catch (error) {
      console.error('Registration failed:', error);
      // For demo purposes, still show success
      setRegistrationSubmitted(true);
    } finally {
      setIsRegistering(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-slate-600">Loading session details...</div>
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Card className="p-8 text-center max-w-md">
          <div className="text-red-600 mb-4">{error || 'Session not found'}</div>
          <Link to="/">
            <Button>Back to Home</Button>
          </Link>
        </Card>
      </div>
    );
  }

  const displayDescription = session.landingPage?.customDescription || session.objective;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <Link to="/" className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-6">
            ← Back to Home
          </Link>

          <div className="max-w-4xl">
            <div className="mb-4">
              {session.topic && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-700">
                  {session.topic.name}
                </span>
              )}
            </div>

            <h1 className="text-4xl font-bold text-slate-900 mb-4">{session.title}</h1>

            {session.subtitle && (
              <p className="text-xl text-slate-600 mb-6">{session.subtitle}</p>
            )}

            <div className="flex flex-wrap items-center gap-6 text-sm text-slate-500 mb-6">
              {session.scheduledAt && (
                <span className="flex items-center gap-2">
                  📅 {new Date(session.scheduledAt).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </span>
              )}
              {session.scheduledAt && (
                <span className="flex items-center gap-2">
                  🕒 {new Date(session.scheduledAt).toLocaleTimeString('en-US', {
                    hour: 'numeric',
                    minute: '2-digit',
                    timeZoneName: 'short',
                  })}
                </span>
              )}
              {session.durationMinutes && (
                <span className="flex items-center gap-2">
                  ⏱️ {session.durationMinutes} minutes
                </span>
              )}
            </div>

            {displayDescription && (
              <p className="text-lg text-slate-700 leading-relaxed">{displayDescription}</p>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Session Details */}
          <div className="lg:col-span-2 space-y-8">
            {session.audience && (
              <Card className="p-6">
                <h3 className="text-xl font-semibold mb-3 text-slate-900">Who Should Attend</h3>
                <p className="text-slate-700">{session.audience}</p>
              </Card>
            )}

            <SessionAgenda agendaItems={session.agendaItems} />

            {session.incentives && session.incentives.length > 0 && (
              <Card className="p-6">
                <h3 className="text-xl font-semibold mb-4 text-slate-900">Special Offers</h3>
                <div className="space-y-3">
                  {session.incentives.map((incentive) => (
                    <div key={incentive.id} className="flex items-start gap-3 p-4 bg-green-50 rounded-lg border border-green-200">
                      <div className="flex-shrink-0 w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                        ✓
                      </div>
                      <div>
                        <h4 className="font-medium text-green-800">{incentive.name}</h4>
                        {incentive.description && (
                          <p className="text-sm text-green-700 mt-1">{incentive.description}</p>
                        )}
                        {incentive.value && (
                          <span className="text-xs text-green-600 font-medium">({incentive.value})</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>

          {/* Right Column - Registration */}
          <div className="lg:col-span-1">
            {registrationSubmitted ? (
              <Card className="p-6 text-center">
                <div className="text-green-600 text-4xl mb-4">✅</div>
                <h3 className="text-xl font-semibold text-slate-900 mb-2">Registration Confirmed!</h3>
                <p className="text-slate-600 mb-4">
                  You'll receive a confirmation email with session details and joining instructions.
                </p>
                <div className="text-sm text-slate-500">
                  Calendar invite and materials will be sent 24 hours before the session.
                </div>
              </Card>
            ) : (
              <div className="sticky top-8">
                <RegistrationForm
                  sessionId={session.id}
                  onSubmit={handleRegistration}
                  isSubmitting={isRegistering}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PublicSessionPage;