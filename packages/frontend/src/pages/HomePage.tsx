import React from 'react';
import { Link } from 'react-router-dom';
import { BuilderLayout } from '../layouts/BuilderLayout';
import { Button } from '../ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/card';
import { useAuth } from '../contexts/AuthContext';
import { UserRole } from '../types/auth.types';

const HomePage: React.FC = () => {
  const { user } = useAuth();

  const isContentDeveloper = user?.role.name === UserRole.CONTENT_DEVELOPER;
  const isBroker = user?.role.name === UserRole.BROKER;

  const features = [
    {
      icon: '🎯',
      title: 'AI Session Builder',
      description: 'Create engaging training sessions with AI assistance',
      link: '/sessions/builder/new',
      roles: [UserRole.CONTENT_DEVELOPER]
    },
      {
      icon: '📊',
      title: 'Analytics Dashboard',
      description: 'Track performance and engagement metrics',
      link: '/analytics',
      roles: [UserRole.CONTENT_DEVELOPER, UserRole.BROKER]
    },
    {
      icon: '📚',
      title: 'Session Management',
      description: 'Organize and manage your training library',
      link: '/sessions',
      roles: [UserRole.CONTENT_DEVELOPER, UserRole.BROKER]
    },
    {
      icon: '🏷️',
      title: 'Topic Catalog',
      description: 'Maintain your training content topics',
      link: '/topics',
      roles: [UserRole.CONTENT_DEVELOPER]
    },
    {
      icon: '🎁',
      title: 'Incentives',
      description: 'Manage rewards and engagement programs',
      link: '/incentives',
      roles: [UserRole.CONTENT_DEVELOPER, UserRole.BROKER]
    },
    {
      icon: '📍',
      title: 'Location Management',
      description: 'Configure training venues and facilities',
      link: '/admin/locations',
      roles: [UserRole.CONTENT_DEVELOPER]
    }
  ];

  const userFeatures = features.filter(feature =>
    feature.roles.includes(user?.role.name as UserRole)
  );

  return (
    <BuilderLayout
      title="Welcome to Training Builder"
      subtitle="Your comprehensive training management platform"
    >
      <div className="space-y-8 max-w-6xl">
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 sm:p-8 border border-slate-200">
          <div className="text-center">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-4">
              {isContentDeveloper
                ? 'Build Amazing Training Experiences'
                : isBroker
                ? 'Manage Your Training Network'
                : 'Professional Training Platform'
              }
            </h2>
            <p className="text-lg text-slate-600 mb-6 max-w-2xl mx-auto">
              {isContentDeveloper
                ? 'Use AI-powered tools to create, manage, and deliver exceptional leadership training sessions.'
                : isBroker
                ? 'Book sessions, track performance, and manage your training portfolio with ease.'
                : 'Streamline your training operations with our comprehensive management tools.'
              }
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center flex-wrap">
              {isContentDeveloper ? (
                <>
                  <Button asChild size="lg">
                    <Link to="/sessions/builder/new">
                      🤖 Guided Session Builder
                    </Link>
                  </Button>
                    <Button asChild variant="outline" size="lg">
                    <Link to="/analytics">
                      📈 View Analytics
                    </Link>
                  </Button>
                </>
              ) : (
                <>
                  <Button asChild size="lg">
                    <Link to="/dashboard">
                      📊 View Dashboard
                    </Link>
                  </Button>
                  <Button asChild variant="outline" size="lg">
                    <Link to="/analytics">
                      📈 View Analytics
                    </Link>
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Feature Grid */}
        <div>
          <h3 className="text-xl font-semibold text-slate-900 mb-6 text-center">
            Available Features
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {userFeatures.map((feature) => (
              <Card key={feature.title} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="text-center">
                    <div className="text-4xl mb-4">{feature.icon}</div>
                    <CardTitle className="mb-2">{feature.title}</CardTitle>
                    <CardDescription className="mb-4 text-sm">
                      {feature.description}
                    </CardDescription>
                    <Button asChild variant="outline" className="w-full">
                      <Link to={feature.link}>
                        Get Started
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-6 border-t border-slate-200">
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600">24</div>
            <div className="text-sm text-slate-600">Active Sessions</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600">89%</div>
            <div className="text-sm text-slate-600">Satisfaction</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-purple-600">156</div>
            <div className="text-sm text-slate-600">Participants</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-orange-600">12</div>
            <div className="text-sm text-slate-600">Expert Trainers</div>
          </div>
        </div>

        {/* Getting Started */}
        <Card>
          <CardHeader>
            <CardTitle>Getting Started</CardTitle>
            <CardDescription>Quick tips to maximize your training platform experience</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {isContentDeveloper ? (
                <>
                  <div className="flex items-start gap-4 p-4 bg-blue-50 rounded-lg">
                    <span className="text-2xl">1️⃣</span>
                    <div>
                      <h4 className="font-medium text-blue-900">Start with the AI Builder</h4>
                      <p className="text-sm text-blue-800">Create your first session using our AI-powered builder for quick, professional results.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4 p-4 bg-green-50 rounded-lg">
                    <span className="text-2xl">2️⃣</span>
                    <div>
                      <h4 className="font-medium text-green-900">Organize Your Content</h4>
                      <p className="text-sm text-green-800">Set up topics, categories, and audience segments to keep your training library organized.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4 p-4 bg-purple-50 rounded-lg">
                    <span className="text-2xl">3️⃣</span>
                    <div>
                      <h4 className="font-medium text-purple-900">Track Performance</h4>
                      <p className="text-sm text-purple-800">Use analytics to understand engagement and improve your training effectiveness.</p>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-start gap-4 p-4 bg-blue-50 rounded-lg">
                    <span className="text-2xl">📚</span>
                    <div>
                      <h4 className="font-medium text-blue-900">Browse Available Sessions</h4>
                      <p className="text-sm text-blue-800">Explore our catalog of professional training sessions for your team.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4 p-4 bg-green-50 rounded-lg">
                    <span className="text-2xl">📊</span>
                    <div>
                      <h4 className="font-medium text-green-900">Track Your Progress</h4>
                      <p className="text-sm text-green-800">Monitor bookings, attendance, and outcomes through your personalized dashboard.</p>
                    </div>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </BuilderLayout>
  );
};

export default HomePage;
