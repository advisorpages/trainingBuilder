import * as React from 'react';
import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { BuilderLayout } from './BuilderLayout';

interface AdminDashboardLayoutProps {
  children: React.ReactNode;
}

type AdminTabType = 'prompts' | 'config' | 'status' | 'logs' | 'analytics' | 'categories' | 'locations' | 'trainers' | 'audiences' | 'tones' | 'ai-insights';

interface AdminTab {
  id: AdminTabType;
  label: string;
  icon: string;
  description: string;
}

const adminTabs: AdminTab[] = [
  { id: 'prompts', label: 'AI Prompts', icon: '🤖', description: 'Configure AI generation prompts' },
  { id: 'analytics', label: 'Analytics', icon: '📊', description: 'Performance metrics & insights' },
  { id: 'ai-insights', label: 'AI Insights', icon: '🔍', description: 'Track AI interactions & quality' },
  { id: 'categories', label: 'Categories', icon: '📁', description: 'Session categories' },
  { id: 'locations', label: 'Locations', icon: '🏢', description: 'Training venues' },
  { id: 'trainers', label: 'Trainers', icon: '👨‍🏫', description: 'Trainer management' },
  { id: 'audiences', label: 'Audiences', icon: '👥', description: 'Target audiences' },
  { id: 'tones', label: 'Tones', icon: '🎨', description: 'Content tones & styles' },
  { id: 'config', label: 'API Settings', icon: '⚙️', description: 'System configuration' },
  { id: 'status', label: 'System Status', icon: '💚', description: 'Health monitoring' },
  { id: 'logs', label: 'Logs', icon: '📝', description: 'Application logs' },
];

export const AdminDashboardLayout: React.FC<AdminDashboardLayoutProps> = ({ children }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [isAdminSidebarOpen, setIsAdminSidebarOpen] = useState(false);
  const activeTab = (searchParams.get('tab') as AdminTabType) || 'prompts';

  const handleTabChange = (tabId: AdminTabType) => {
    setSearchParams({ tab: tabId });
    // Close mobile sidebar after selection
    if (window.innerWidth < 1024) {
      setIsAdminSidebarOpen(false);
    }
  };

  // Close sidebar when clicking outside on mobile
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setIsAdminSidebarOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <BuilderLayout
      title="Admin Dashboard"
      subtitle="Manage system settings, monitor status, and configure AI prompts"
    >
      <div className="flex h-full -mx-4 sm:-mx-6 lg:-mx-10 -my-6">
        {/* Mobile Overlay */}
        {isAdminSidebarOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
            onClick={() => setIsAdminSidebarOpen(false)}
          />
        )}

        {/* Left Admin Sidebar */}
        <aside
          className={`
            fixed lg:sticky lg:top-0 inset-y-0 left-0 z-40 w-64 bg-white border-r border-slate-200
            transform transition-transform duration-300 ease-in-out flex flex-col
            lg:translate-x-0 lg:h-screen
            ${isAdminSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          `}
        >
          {/* Sidebar Header */}
          <div className="flex items-center justify-between px-4 py-5 border-b border-slate-200 lg:py-6">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Admin Sections</h3>
              <p className="text-xs text-slate-500 mt-0.5">Quick navigation</p>
            </div>
            <button
              onClick={() => setIsAdminSidebarOpen(false)}
              className="lg:hidden p-1.5 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Admin Tabs Navigation */}
          <nav className="flex-1 overflow-y-auto px-3 py-4">
            <div className="space-y-1">
              {adminTabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={`
                    w-full text-left px-3 py-2.5 rounded-lg transition-all duration-150
                    flex items-center gap-3 group
                    ${
                      activeTab === tab.id
                        ? 'bg-blue-50 text-blue-700 border border-blue-200'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 border border-transparent'
                    }
                  `}
                >
                  <span className="text-xl flex-shrink-0">{tab.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium truncate ${activeTab === tab.id ? 'text-blue-700' : 'text-slate-900'}`}>
                      {tab.label}
                    </p>
                    <p className={`text-xs truncate ${activeTab === tab.id ? 'text-blue-600' : 'text-slate-500'}`}>
                      {tab.description}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </nav>

          {/* Sidebar Footer */}
          <div className="px-4 py-4 border-t border-slate-200">
            <div className="bg-slate-50 rounded-lg p-3">
              <p className="text-xs font-medium text-slate-700">💡 Admin Tip</p>
              <p className="text-xs text-slate-600 mt-1">
                Use keyboard shortcuts: ⌘+K to search settings
              </p>
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto px-6 py-8 sm:px-8 lg:px-12 bg-slate-50">
          {/* Mobile Menu Toggle */}
          <div className="lg:hidden mb-6">
            <button
              onClick={() => setIsAdminSidebarOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-50 transition-colors shadow-sm"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
              <span className="text-sm font-medium">Admin Menu</span>
            </button>
          </div>

          {children}
        </main>
      </div>
    </BuilderLayout>
  );
};
