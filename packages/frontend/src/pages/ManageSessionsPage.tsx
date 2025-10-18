import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { BuilderLayout } from '../layouts/BuilderLayout';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../ui/tabs';
import { sessionService } from '../services/session.service';
import { Topic, SessionStatus } from '@leadership-training/shared';
import { useBreakpoint } from '../hooks/useBreakpoint';
import { SessionCard } from '../components/sessions/SessionCard';
import { SessionDrawer } from '../components/sessions/SessionDrawer';
import { SessionDetailsModal } from '../components/sessions/SessionDetailsModal';
import { ReadinessScoreModal } from '../components/sessions/ReadinessScoreModal';

interface SessionWithRelations {
  id: string;
  title: string;
  subtitle?: string;
  status: any;
  readinessScore?: number;
  scheduledAt?: Date | string | null;
  durationMinutes?: number;
  location?: {
    name: string;
    locationType: string;
  };
  categoryId?: string;
  category?: {
    name: string;
  };
  topics?: any[];
  sessionTopics?: any[];
}


export const ManageSessionsPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [sessions, setSessions] = useState<SessionWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSession, setSelectedSession] = useState<string | null>(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [readinessModalOpen, setReadinessModalOpen] = useState(false);
  const [selectedReadinessSession, setSelectedReadinessSession] = useState<string | null>(null);
  const [availableCategories, setAvailableCategories] = useState<Array<{ id: string; name: string }>>([]);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const [postUpdateSessionId, setPostUpdateSessionId] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [sessionToDelete, setSessionToDelete] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteDialogOpening, setDeleteDialogOpening] = useState(false);
  const [selectedTab, setSelectedTab] = useState('published');
  const breakpoint = useBreakpoint();

  useEffect(() => {
    const state = location.state as { updatedSessionId?: string; fromSessionsList?: boolean };
    if (state?.updatedSessionId) {
      setPostUpdateSessionId(state.updatedSessionId);
      navigate(location.pathname, { replace: true, state: undefined });
    }
  }, [location, navigate]);

  useEffect(() => {
    fetchSessions();
  }, []);

  // Get available categories for display
  const getAvailableCategories = (sessions: SessionWithRelations[]) => {
    const categories = new Map<string, string>();
    sessions.forEach(session => {
      if (session.categoryId) {
        const id = String(session.categoryId);
        categories.set(id, session.category?.name || 'Unknown');
      }
    });

    return Array.from(categories.entries()).map(([id, name]) => ({ id, name }));
  };

  const fetchSessions = async () => {
    try {
      setLoading(true);
      const data = await sessionService.getSessions();
      const sessionsData = Array.isArray(data) ? data.map((session): SessionWithRelations => {
        // Calculate duration in minutes from start and end times
        let durationMinutes: number | undefined;
        if (session.startTime && session.endTime) {
          const start = new Date(session.startTime);
          const end = new Date(session.endTime);
          if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
            durationMinutes = Math.round((end.getTime() - start.getTime()) / (1000 * 60));
          }
        }

        return {
          ...session,
          categoryId: session.categoryId ? String(session.categoryId) : undefined,
          scheduledAt: session.startTime,
          durationMinutes,
          location: session.location ? {
            name: session.location.name,
            locationType: session.location.locationType
          } : undefined,
          category: session.category ? {
            name: session.category.name
          } : undefined
        };
      }) : [];

      // Filter out archived sessions
      const filteredData = sessionsData.filter(session => {
        // By default, hide archived sessions
        if (session.status === 'retired' || session.status === 'cancelled') {
          return false;
        }
        return true;
      });

      // Update available categories
      setAvailableCategories(getAvailableCategories(sessionsData));
      setSessions(filteredData);
    } catch (error) {
      console.error('Failed to fetch sessions:', error);
      setSessions([]);
      setAvailableCategories([]);
    } finally {
      setLoading(false);
    }
  };

  // Event handlers
  const handleSessionSelect = (sessionId: string) => {
    setSelectedSession(sessionId);
    if (breakpoint === 'mobile') {
      setIsMobileDrawerOpen(true);
    }
  };

  const handleEditSession = (sessionId: string) => {
    navigate(`/sessions/builder/edit/${sessionId}`, {
      state: { from: 'sessions-list' },
    });
  };

  const handleViewDetails = (sessionId: string) => {
    setSelectedSession(sessionId);
    setDetailsModalOpen(true);
  };

  const handleCloseDetailsModal = () => {
    setDetailsModalOpen(false);
    setSelectedSession(null);
  };

  const handleMobileDrawerClose = () => {
    setIsMobileDrawerOpen(false);
  };

  const handleReadinessClick = (sessionId: string) => {
    setSelectedReadinessSession(sessionId);
    setReadinessModalOpen(true);
  };

  const handleCloseReadinessModal = () => {
    setReadinessModalOpen(false);
    setSelectedReadinessSession(null);
  };

  const handleNewGuidedSession = () => {
    navigate('/sessions/builder/new');
  };

  const handleDeleteSession = (sessionId: string) => {
    console.log('Delete session clicked:', sessionId);

    // Prevent multiple dialog openings
    if (deleteDialogOpening || deleteDialogOpen) {
      console.log('Delete dialog already opening/open, ignoring click');
      return;
    }

    setDeleteDialogOpening(true);
    setSessionToDelete(sessionId);
    setDeleteDialogOpen(true);

    // Reset the opening flag after a short delay
    setTimeout(() => {
      setDeleteDialogOpening(false);
    }, 100);
  };

  const handleConfirmDelete = async () => {
    if (!sessionToDelete) {
      console.error('No session to delete');
      return;
    }

    console.log('Confirming delete for session:', sessionToDelete);

    try {
      setDeleting(true);

      // Try single delete first, fallback to bulk delete if there's a schema issue
      try {
        await sessionService.deleteSession(sessionToDelete);
        console.log('Session deleted successfully:', sessionToDelete);
      } catch (singleDeleteError) {
        console.log('Single delete failed, trying bulk delete:', singleDeleteError);
        // Fallback to bulk delete method
        await sessionService.bulkDelete([sessionToDelete]);
        console.log('Session deleted successfully via bulk delete:', sessionToDelete);
      }

      // Remove the session from the local state
      setSessions(prevSessions => {
        const updated = prevSessions.filter(session => session.id !== sessionToDelete);
        console.log('Updated sessions list:', updated);
        return updated;
      });

      // Close the dialog
      setDeleteDialogOpen(false);
      setSessionToDelete(null);
      console.log('Delete dialog closed');
    } catch (error) {
      console.error('Failed to delete session:', error);
      alert('Failed to delete session. Please try again.');
    } finally {
      setDeleting(false);
    }
  };

  const handleCancelDelete = () => {
    setDeleteDialogOpen(false);
    setSessionToDelete(null);
  };

  // Helper function to get ordered topics with trainers
  const getOrderedTopicsWithTrainers = (session: SessionWithRelations) => {
    if (!session) {
      return [];
    }

    // Helper to get trainers for a specific session topic
    const getTrainersForSessionTopic = (sessionTopic: any): Array<{ id: number | string; name?: string }> => {
      const trainers: Array<{ id: number | string; name?: string }> = [];

      // Check for trainers array in sessionTopic
      if (Array.isArray(sessionTopic?.trainers)) {
        sessionTopic.trainers.forEach((trainer: any) => {
          if (trainer?.id !== undefined && trainer?.id !== null) {
            trainers.push({
              id: trainer.id,
              name: trainer.name || `Trainer ${trainer.id}`
            });
          }
        });
      }

      // Check for single trainer assignment
      if (sessionTopic?.trainer && sessionTopic?.trainer?.id !== undefined && sessionTopic?.trainer?.id !== null) {
        trainers.push({
          id: sessionTopic.trainer.id,
          name: sessionTopic.trainer.name || `Trainer ${sessionTopic.trainer.id}`
        });
      }

      // Check trainerId fallback
      if (sessionTopic?.trainerId !== undefined && sessionTopic?.trainerId !== null) {
        const trainerName = (sessionTopic as any).trainerName || `Trainer ${sessionTopic.trainerId}`;
        if (!trainers.find((t: any) => t.id === sessionTopic.trainerId)) {
          trainers.push({
            id: sessionTopic.trainerId,
            name: trainerName
          });
        }
      }

      return trainers;
    };

    if (Array.isArray(session.sessionTopics) && session.sessionTopics.length > 0) {
      const topicsById = new Map<number, Pick<Topic, 'id' | 'name' | 'description'>>(
        (session.topics ?? []).map((topic) => [topic.id, topic]),
      );

      return [...session.sessionTopics]
        .sort((a, b) => {
          const orderA = typeof a.sequenceOrder === 'number' ? a.sequenceOrder : Number.MAX_SAFE_INTEGER;
          const orderB = typeof b.sequenceOrder === 'number' ? b.sequenceOrder : Number.MAX_SAFE_INTEGER;
          return orderA - orderB;
        })
        .map((sessionTopic, index) => {
          const fallbackOrderLabel =
            typeof sessionTopic.sequenceOrder === 'number'
              ? sessionTopic.sequenceOrder
              : index + 1;

          const topic =
            sessionTopic.topic ??
            (typeof sessionTopic.topicId === 'number'
              ? topicsById.get(sessionTopic.topicId)
              : undefined);

          const trainers = getTrainersForSessionTopic(sessionTopic);

          if (topic) {
            return {
              id: `${topic.id ?? sessionTopic.topicId ?? `session-topic-${index}`}-${index}`,
              topicId: topic.id ?? sessionTopic.topicId,
              name: topic.name,
              description: topic.description,
              sequenceOrder: fallbackOrderLabel,
              trainers,
            };
          }

          return {
            id: `${sessionTopic.topicId ?? `session-topic-${index}`}-${index}`,
            topicId: sessionTopic.topicId,
            name: `Topic ${fallbackOrderLabel}`,
            description: (sessionTopic as any).notes ?? '',
            sequenceOrder: fallbackOrderLabel,
            trainers,
          };
        });
    }

    // Fallback for basic topics structure
    return (session.topics || []).map((topic, index) => ({
      id: `${topic.id ?? `topic-${index}`}-${index}`,
      topicId: topic.id,
      name: topic.name,
      description: topic.description,
      sequenceOrder: index + 1,
      trainers: [], // No trainer assignment info in basic structure
    }));
  };

  // Filter sessions by status
  const publishedSessions = sessions.filter(session => session.status === SessionStatus.PUBLISHED);
  const draftSessions = sessions.filter(session =>
    session.status === SessionStatus.DRAFT ||
    session.status === SessionStatus.REVIEW ||
    session.status === SessionStatus.READY
  );

  // Get sessions for current tab
  const currentTabSessions = selectedTab === 'published' ? publishedSessions : draftSessions;

  // Get selected session data
  const selectedSessionData = sessions.find(s => s.id === selectedSession);
  const selectedSessionTopics = selectedSessionData ? getOrderedTopicsWithTrainers(selectedSessionData) : [];

  return (
    <BuilderLayout
      title="Manage Sessions"
      subtitle="View and manage your training sessions"
      statusSlot={null}
    >
      <div className="h-full flex flex-col">
        {/* Success/Error Messages */}
        {postUpdateSessionId && (
          <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg mb-4">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-medium text-green-800">Session updated successfully!</h3>
                <p className="text-sm text-green-600">Your changes have been saved.</p>
              </div>
            </div>
            <button
              onClick={() => setPostUpdateSessionId(null)}
              className="text-green-600 hover:text-green-800"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

        {/* Grid Layout for All Devices */}
        <div className="flex-1 flex flex-col min-h-0">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-900">
              {selectedTab === 'published' ? 'Published' : 'Drafts'} ({currentTabSessions.length})
            </h2>
            <Button
              onClick={handleNewGuidedSession}
              size={breakpoint === 'mobile' ? 'sm' : 'default'}
            >
              New Session
            </Button>
          </div>

          {/* Tabbed Interface */}
          <Tabs defaultValue="published" value={selectedTab} onValueChange={setSelectedTab} className="flex-1 flex flex-col">
            <TabsList className="mb-4">
              <TabsTrigger value="published">
                Published ({publishedSessions.length})
              </TabsTrigger>
              <TabsTrigger value="draft">
                Drafts ({draftSessions.length})
              </TabsTrigger>
            </TabsList>

            {/* Published Sessions Tab */}
            <TabsContent value="published" className="flex-1 flex flex-col min-h-0 mt-0">
              <div className="flex-1 overflow-y-auto">
                {loading ? (
                  <div className="flex justify-center items-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                ) : publishedSessions.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {publishedSessions.map((session) => (
                      <SessionCard
                        key={session.id}
                        session={session}
                        orderedTopicsWithTrainers={getOrderedTopicsWithTrainers(session)}
                        isSelected={selectedSession === session.id}
                        onSelectionChange={handleSessionSelect}
                        onEditSession={handleEditSession}
                        onViewDetails={handleViewDetails}
                        onDeleteSession={handleDeleteSession}
                        onReadinessClick={handleReadinessClick}
                        availableCategories={availableCategories}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                      <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-medium text-slate-900 mb-2">No published sessions</h3>
                    <p className="text-slate-600 mb-4 max-w-md">
                      Your published sessions will appear here once they're ready to go live.
                    </p>
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Draft Sessions Tab */}
            <TabsContent value="draft" className="flex-1 flex flex-col min-h-0 mt-0">
              <div className="flex-1 overflow-y-auto">
                {loading ? (
                  <div className="flex justify-center items-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                ) : draftSessions.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {draftSessions.map((session) => (
                      <SessionCard
                        key={session.id}
                        session={session}
                        orderedTopicsWithTrainers={getOrderedTopicsWithTrainers(session)}
                        isSelected={selectedSession === session.id}
                        onSelectionChange={handleSessionSelect}
                        onEditSession={handleEditSession}
                        onViewDetails={handleViewDetails}
                        onDeleteSession={handleDeleteSession}
                        onReadinessClick={handleReadinessClick}
                        availableCategories={availableCategories}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                      <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-medium text-slate-900 mb-2">No draft sessions</h3>
                    <p className="text-slate-600 mb-4 max-w-md">
                      Get started by creating your first training session.
                    </p>
                    <Button onClick={handleNewGuidedSession}>
                      Create Your First Session
                    </Button>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>

          {/* Mobile Drawer */}
          {breakpoint === 'mobile' && (
            <SessionDrawer
              session={selectedSessionData || null}
              orderedTopicsWithTrainers={selectedSessionTopics}
              availableCategories={availableCategories}
              isOpen={isMobileDrawerOpen}
              onClose={handleMobileDrawerClose}
              onEditSession={handleEditSession}
            />
          )}

          {/* Details Modal */}
          <SessionDetailsModal
            session={selectedSessionData || null}
            orderedTopicsWithTrainers={selectedSessionTopics}
            availableCategories={availableCategories}
            isOpen={detailsModalOpen}
            onClose={handleCloseDetailsModal}
            onEditSession={handleEditSession}
          />

          {/* Delete Confirmation Dialog */}
          <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Delete Session</DialogTitle>
                <DialogDescription>
                  Are you sure you want to delete this session? This action cannot be undone.
                </DialogDescription>
              </DialogHeader>
              <div className="flex justify-end gap-3 mt-6">
                <Button
                  variant="outline"
                  onClick={handleCancelDelete}
                  disabled={deleting}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleConfirmDelete}
                  disabled={deleting}
                >
                  {deleting ? 'Deleting...' : 'Delete'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* Readiness Score Modal */}
          <ReadinessScoreModal
            isOpen={readinessModalOpen}
            onClose={handleCloseReadinessModal}
            sessionId={selectedReadinessSession}
            sessionTitle={selectedSessionData?.title}
          />
        </div>
      </div>
    </BuilderLayout>
  );
};

export default ManageSessionsPage;