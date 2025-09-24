import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { UserRole } from '../types/auth.types';
import { SessionBuilderInputStep } from '../components/session-builder/SessionBuilderInputStep';
import { SessionOutlineDisplay } from '../components/session-builder/SessionOutlineDisplay';
import { SessionOutlineEditor } from '../components/session-builder/SessionOutlineEditor';
import { sessionBuilderService, SessionBuilderInput, SessionOutline, SessionOutlineResponse } from '../services/session-builder.service';

type WizardStep = 'input' | 'outline' | 'edit';

export const SessionBuilderPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [currentStep, setCurrentStep] = useState<WizardStep>('input');
  // Helper to format Date to input[type="datetime-local"] value (local time)
  const toLocalInput = (dt: Date) => {
    const pad = (n: number) => n.toString().padStart(2, '0');
    const yyyy = dt.getFullYear();
    const mm = pad(dt.getMonth() + 1);
    const dd = pad(dt.getDate());
    const hh = pad(dt.getHours());
    const min = pad(dt.getMinutes());
    return `${yyyy}-${mm}-${dd}T${hh}:${min}`;
  };

  // Provide sensible defaults so testing doesn't require manual entry
  const defaultStart = new Date();
  defaultStart.setHours(defaultStart.getHours() + 1, 0, 0, 0); // next hour
  const defaultEnd = new Date(defaultStart.getTime() + 60 * 60 * 1000); // +1 hour
  const defaultDate = `${defaultStart.getFullYear()}-${String(defaultStart.getMonth() + 1).padStart(2, '0')}-${String(defaultStart.getDate()).padStart(2, '0')}`;

  const [sessionInput, setSessionInput] = useState<Partial<SessionBuilderInput>>({
    category: 'Leadership',
    sessionType: 'workshop',
    desiredOutcome: 'Improve team communication and collaboration',
    currentProblem: 'Teams struggle with effective feedback and alignment',
    specificTopics: 'Active listening, feedback frameworks, meeting hygiene',
    date: defaultDate,
    startTime: toLocalInput(defaultStart),
    endTime: toLocalInput(defaultEnd),
  });
  const [sessionOutline, setSessionOutline] = useState<SessionOutline | null>(null);
  const [originalOutlineForEdit, setOriginalOutlineForEdit] = useState<SessionOutline | null>(null);
  const [outlineResponse, setOutlineResponse] = useState<SessionOutlineResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [notification, setNotification] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
  } | null>(null);

  // Check access permissions (robust role extraction)
  const userRoleName = (user as any)?.role?.name || (user as any)?.roleName || (typeof (user as any)?.role === 'string' ? (user as any).role : undefined);
  const canCreateSessions = userRoleName === UserRole.CONTENT_DEVELOPER || userRoleName === UserRole.BROKER;

  const showNotification = (type: 'success' | 'error' | 'info', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

  const handleInputComplete = async () => {
    setIsLoading(true);
    try {
      const response = await sessionBuilderService.generateSessionOutline(sessionInput as SessionBuilderInput);
      setOutlineResponse(response);
      setSessionOutline(response.outline);
      setCurrentStep('outline');

      if (response.generationMetadata.fallbackUsed) {
        showNotification('info', 'Generated using database content. For enhanced suggestions, check your knowledge base connection.');
      } else if (response.ragAvailable) {
        showNotification('success', 'Session outline generated with AI-enhanced content from your knowledge base!');
      } else {
        showNotification('success', 'Session outline generated successfully!');
      }
    } catch (error: any) {
      showNotification('error', error.message || 'Failed to generate session outline');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditOutline = () => {
    if (sessionOutline) {
      // Deep clone to allow cancel
      setOriginalOutlineForEdit(JSON.parse(JSON.stringify(sessionOutline)));
    }
    setCurrentStep('edit');
  };

  const handleRegenerateOutline = async () => {
    setIsLoading(true);
    try {
      const response = await sessionBuilderService.generateSessionOutline(sessionInput as SessionBuilderInput);
      setOutlineResponse(response);
      setSessionOutline(response.outline);
      showNotification('success', 'Session outline regenerated successfully!');
    } catch (error: any) {
      showNotification('error', error.message || 'Failed to regenerate session outline');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApproveOutline = async () => {
    if (!sessionOutline || !sessionInput) return;

    setIsLoading(true);
    try {
      const sessionData = await sessionBuilderService.createSessionFromOutline({
        outline: sessionOutline,
        input: sessionInput as SessionBuilderInput
      });

      showNotification('success', 'Session created successfully!');

      // Navigate to the created session
      setTimeout(() => {
        setIsLoading(false);
        // Created sessions are drafts; navigate to Manage Sessions where the user can finalize/publish
        navigate('/sessions/manage', { replace: true, state: { fromBuilder: true, sessionId: sessionData.id } });
      }, 1500);
    } catch (error: any) {
      showNotification('error', error.message || 'Failed to create session');
      setIsLoading(false);
    }
  };

  // ===== Editor handlers (flexible) =====
  const handleOutlineChange = (updated: SessionOutline) => {
    setSessionOutline(updated);
  };

  const handleSaveOutlineChanges = async () => {
    if (!sessionOutline) return;
    try {
      const result = await sessionBuilderService.validateOutline(sessionOutline);
      if (!result.isValid) {
        showNotification('error', `Please resolve ${result.errors.length} validation issue(s) before saving.`);
        return;
      }
      setOriginalOutlineForEdit(null);
      setCurrentStep('outline');
      showNotification('success', 'Outline changes saved.');
    } catch (e: any) {
      showNotification('error', e.message || 'Failed to validate outline');
    }
  };

  const handleCancelOutlineChanges = () => {
    if (originalOutlineForEdit) {
      setSessionOutline(originalOutlineForEdit);
      setOriginalOutlineForEdit(null);
    }
    setCurrentStep('outline');
  };

  // (deprecated duplicates removed)

  const renderStepIndicator = () => {
    const steps = [
      { key: 'input', label: 'Session Details', completed: currentStep !== 'input' },
      { key: 'outline', label: 'Review Outline', completed: false },
      { key: 'edit', label: 'Customize', completed: false }
    ];

    return (
      <div className="mb-8">
        <nav aria-label="Progress">
          <ol className="flex items-center">
            {steps.map((step, stepIdx) => (
              <li key={step.key} className={`relative ${stepIdx !== steps.length - 1 ? 'pr-8 sm:pr-20' : ''}`}>
                <div className="flex items-center">
                  <div className={`flex h-8 w-8 items-center justify-center rounded-full border-2 ${
                    step.completed || currentStep === step.key
                      ? 'border-blue-600 bg-blue-600 text-white'
                      : 'border-gray-300 bg-white text-gray-500'
                  }`}>
                    {step.completed ? (
                      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      <span className="text-sm font-medium">{stepIdx + 1}</span>
                    )}
                  </div>
                  <span className={`ml-2 text-sm font-medium ${
                    step.completed || currentStep === step.key ? 'text-blue-600' : 'text-gray-500'
                  }`}>
                    {step.label}
                  </span>
                </div>
                {stepIdx !== steps.length - 1 && (
                  <div className="absolute top-4 left-4 -ml-px mt-0.5 h-full w-0.5 bg-gray-300" aria-hidden="true" />
                )}
              </li>
            ))}
          </ol>
        </nav>
      </div>
    );
  };

  if (!canCreateSessions) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">Access Restricted</h3>
                <p className="mt-1 text-sm text-yellow-700">
                  You need Content Developer or Broker permissions to use the Session Builder.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">AI Session Builder</h1>
              <p className="mt-1 text-sm text-gray-500">
                Create comprehensive training sessions with AI-powered content suggestions
              </p>
            </div>
          </div>

          {/* Breadcrumb */}
          <nav className="flex mt-4" aria-label="Breadcrumb">
            <ol className="flex items-center space-x-2">
              <li>
                <Link to="/dashboard" className="text-blue-600 hover:text-blue-800">
                  Dashboard
                </Link>
              </li>
              <li>
                <span className="text-gray-400">/</span>
              </li>
              <li>
                <span className="text-gray-500">Session Builder</span>
              </li>
            </ol>
          </nav>
        </div>

        {/* Notification */}
        {notification && (
          <div className={`mb-6 p-4 rounded-md border ${
            notification.type === 'success'
              ? 'bg-green-50 border-green-200 text-green-800'
              : notification.type === 'error'
              ? 'bg-red-50 border-red-200 text-red-800'
              : 'bg-blue-50 border-blue-200 text-blue-800'
          }`}>
            <div className="flex items-center">
              <div className="flex-shrink-0">
                {notification.type === 'success' && (
                  <svg className="h-5 w-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                )}
                {notification.type === 'error' && (
                  <svg className="h-5 w-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                )}
                {notification.type === 'info' && (
                  <svg className="h-5 w-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
              <div className="ml-3">
                <p className="text-sm">{notification.message}</p>
              </div>
              <div className="ml-auto pl-3">
                <button
                  onClick={() => setNotification(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <span className="sr-only">Dismiss</span>
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step Indicator */}
        {renderStepIndicator()}

        {/* Main Content */}
        <div className="bg-white shadow rounded-lg">
          <div className="p-6">
            {currentStep === 'input' && (
              <SessionBuilderInputStep
                input={sessionInput}
                onInputChange={setSessionInput}
                onNext={handleInputComplete}
                isLoading={isLoading}
              />
            )}

            {currentStep === 'outline' && sessionOutline && (
              <SessionOutlineDisplay
                outline={sessionOutline}
                generationMetadata={outlineResponse?.generationMetadata}
                onEdit={handleEditOutline}
                onApprove={handleApproveOutline}
                onRegenerate={handleRegenerateOutline}
                isProcessing={isLoading}
              />
            )}

            {currentStep === 'edit' && sessionOutline && (
              <SessionOutlineEditor
                outline={sessionOutline}
                onOutlineChange={handleOutlineChange}
                onSave={handleSaveOutlineChanges}
                onCancel={handleCancelOutlineChanges}
                categoryName={sessionInput.category}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
