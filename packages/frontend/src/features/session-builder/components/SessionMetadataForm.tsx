import * as React from 'react';
import { Input, Card, CardContent, CardHeader, CardTitle, Button } from '../../../ui';
import { SessionMetadata, SessionTopicDraft } from '../state/types';
import { cn } from '../../../lib/utils';
import { CategorySelect } from '@/components/ui/CategorySelect';
import { LocationSelect } from '@/components/ui/LocationSelect';
import { Audience, Tone } from '@leadership-training/shared';
import { audienceService } from '../../../services/audience.service';
import { toneService } from '../../../services/tone.service';

interface SessionMetadataFormProps {
  metadata: SessionMetadata;
  onChange: (updates: Partial<SessionMetadata>) => void;
  mode?: 'guided' | 'classic';
}

const sessionTypes: SessionMetadata['sessionType'][] = [
  'workshop',
  'training',
  'event',
  'webinar',
];

const toDateInputValue = (value: string) => value.slice(0, 10);

const toDateTimeLocal = (value: string) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const offset = date.getTimezoneOffset();
  const adjusted = new Date(date.getTime() - offset * 60 * 1000);
  return adjusted.toISOString().slice(0, 16);
};

const fromDateTimeLocal = (value: string) => {
  if (!value) return new Date().toISOString();
  const date = new Date(value);
  return date.toISOString();
};

const timeSegment = (value: string) => {
  const local = toDateTimeLocal(value);
  if (!local) return '09:00';
  const segment = local.split('T')[1];
  return segment || '09:00';
};

// Generate static test data for development
const generateTestData = (): SessionMetadata => {
  const today = new Date();
  const startTime = new Date(today);
  startTime.setHours(9, 0, 0, 0); // 9:00 AM
  const endTime = new Date(today);
  endTime.setHours(12, 0, 0, 0); // 12:00 PM (3 hours)

  return {
    title: 'Effective Leadership Through Change',
    sessionType: '' as any,
    category: 'Leadership',
    categoryId: 1,
    desiredOutcome: 'Participants will be able to lead their teams through organizational change with confidence and clear communication strategies',
    currentProblem: 'Managers struggle to maintain team morale and productivity during periods of uncertainty and organizational transitions',
    specificTopics: 'Change management frameworks, transparent communication, building psychological safety, managing resistance',
    startDate: today.toISOString().slice(0, 10),
    startTime: startTime.toISOString(),
    endTime: endTime.toISOString(),
    timezone: 'America/New_York',
    location: 'Main Conference Room',
    locationId: 1,
    audienceId: 1,
    audienceName: 'Mid-level Managers',
    toneId: 1,
    toneName: 'Professional',
  };
};

const bulletify = (lines: string[]) => lines.map(line => `• ${line}`).join('\n');

// Sample data for past topics - would be fetched from API
const getPastTopicsByCategory = (categoryId: number) => {
  const sampleTopics = {
    1: [ // Leadership
      {
        id: 1,
        title: "Giving constructive feedback to peers",
        usageCount: 3,
        rating: "Highly rated",
        context: "Your team needed honest peer reviews during project retrospectives"
      },
      {
        id: 2,
        title: "Delegation without micromanaging",
        usageCount: 2,
        rating: "Good ratings",
        context: "New managers struggled with trusting their team members"
      },
      {
        id: 3,
        title: "Running effective 1-on-1s",
        usageCount: 4,
        rating: "Highly rated",
        context: "Your managers wanted more structured check-ins with direct reports"
      }
    ],
    2: [ // Communication
      {
        id: 4,
        title: "Active listening in meetings",
        usageCount: 2,
        rating: "Good ratings",
        context: "Team members were talking over each other in brainstorming sessions"
      },
      {
        id: 5,
        title: "Clear email communication",
        usageCount: 5,
        rating: "Highly rated",
        context: "Your team had confusion around project updates via email"
      },
      {
        id: 6,
        title: "Difficult conversations with clients",
        usageCount: 1,
        rating: "Highly rated",
        context: "Account managers needed to handle scope creep conversations"
      }
    ],
    3: [ // Project Management
      {
        id: 7,
        title: "Clear decision-making frameworks",
        usageCount: 3,
        rating: "Highly rated",
        context: "Your projects stalled because no one could make final decisions"
      },
      {
        id: 8,
        title: "Effective project handoffs",
        usageCount: 2,
        rating: "Good ratings",
        context: "Teams were dropping balls during transitions between phases"
      }
    ]
  };

  return sampleTopics[categoryId as keyof typeof sampleTopics] || [];
};

const generateTestDataWithTopics = (): SessionMetadata => {
  const base = generateTestData();
  const today = new Date();
  const startTime = new Date(today);
  startTime.setHours(10, 0, 0, 0); // 10:00 AM
  const endTime = new Date(startTime.getTime() + 90 * 60 * 1000); // 90 minutes later

  return {
    ...base,
    title: 'Mutual Fund Fundamentals for Client Advisors',
    sessionType: '' as any,
    category: 'Financial Services',
    desiredOutcome: 'Client advisors can confidently explain mutual fund options, align them with client goals, and close more investment opportunities.',
    currentProblem: 'Team members know basic investment terminology but lack a structured approach to positioning mutual funds for existing clients.',
    specificTopics: 'Core mutual fund structures, aligning products to investor profiles, framing value and addressing objections.',
    audienceName: 'Client Advisory Team',
    startTime: startTime.toISOString(),
    endTime: endTime.toISOString(),
    location: 'Onsite - Training Room B',
    topics: [
      {
        title: 'Investment Basics Refresher',
        description: 'Review core investment concepts, mutual fund structures, fee types, and how funds fit into diversified portfolios.',
        durationMinutes: 30,
        learningOutcomes: 'Revisit the core terms and fund types before we dive into client conversations.',
        trainerNotes: bulletify([
          'Kick off with a quick “explain it to a friend” warm-up.',
          'Summarize the three categories of mutual funds.',
          'Highlight one real-life fund example from our current portfolio.',
        ]),
        materialsNeeded: bulletify(['Slide deck with definitions', 'Quick reference handout']),
        deliveryGuidance: 'Use visuals to keep the pace lively and check for understanding every 10 minutes.',
        callToAction: 'Ask each advisor to note one fund they want to recommend this week.',
      },
      {
        title: 'Applying Mutual Funds to Client Scenarios',
        description: 'Map investor profiles to mutual fund categories, practice suitability conversations, and surface compliance guardrails.',
        durationMinutes: 30,
        learningOutcomes: 'Practice matching different investor goals to the right fund story.',
        trainerNotes: bulletify([
          'Run the “client profile” matching activity in pairs.',
          'Model how to explain risk with plain-language comparisons.',
          'Pause after each scenario to surface compliance reminders.',
        ]),
        materialsNeeded: bulletify(['Client persona cards', 'Suitability checklist']),
        deliveryGuidance: 'Keep discussions tight—limit each scenario to five minutes.',
        callToAction: 'Have each advisor jot down a follow-up question to ask their next client.',
      },
      {
        title: 'Pitching and Closing Playbook',
        description: 'Build confidence handling objections, reinforce next-step commitments, and workshop closing language that drives conversions.',
        durationMinutes: 30,
        learningOutcomes: 'Give advisors a simple script to close with confidence.',
        trainerNotes: bulletify([
          'Role-play a “last-minute objection” with volunteers.',
          'Capture winning phrases on the board.',
          'End with a personal commitment share-out.',
        ]),
        materialsNeeded: bulletify(['Whiteboard markers', 'Objection flashcards']),
        deliveryGuidance: 'Keep energy high by rotating speakers quickly.',
        callToAction: 'Challenge advisors to try the new close on their next prospect call.',
      },
    ],
  };
};

const generateRecruitingAgentsData = (): SessionMetadata => {
  const today = new Date();
  const startTime = new Date(today);
  startTime.setHours(13, 0, 0, 0);
  const endTime = new Date(startTime.getTime() + 2 * 60 * 60 * 1000);

  return {
    title: 'Recruiting Rockstar Agents',
    sessionType: '' as any,
    category: 'Professional Skills',
    categoryId: 2,
    desiredOutcome: 'Leaders can confidently pitch our agency, host discovery chats, and sign two qualified agents within 30 days.',
    currentProblem: 'Team leads rely on referrals only and feel unprepared to search for new, motivated agents.',
    specificTopics: 'Share the agency story, spot high-potential candidates, run engaging discovery calls, follow up fast',
    startDate: today.toISOString().slice(0, 10),
    startTime: startTime.toISOString(),
    endTime: endTime.toISOString(),
    timezone: 'America/New_York',
    location: 'Main Conference Room',
    locationId: 1,
    audienceId: 3,
    audienceName: 'Sales Team Leaders',
    toneId: 2,
    toneName: 'Inspiring',
    topics: [
      {
        title: 'Start With Our Story',
        description: 'Simple talking points that hook new agents and show why our team wins.',
        durationMinutes: 25,
        learningOutcomes: 'Leaders can share a three-minute story that makes candidates curious.',
        trainerNotes: bulletify([
          'Play a quick “why I joined” reel from current agents.',
          'Break down the story formula: hook, proof, invite.',
          'Have leaders practice the story in pairs with a timer.',
        ]),
        materialsNeeded: bulletify(['Story one-pager', 'Timer app']),
        deliveryGuidance: 'Keep the practice rounds short; aim for two quick rotations.',
        callToAction: 'Ask each leader to schedule one story call this week.',
      },
      {
        title: 'Find Great Agent Leads',
        description: 'Hands-on look at sourcing tactics: social media, local events, and partner shout-outs.',
        durationMinutes: 30,
        learningOutcomes: 'Leaders leave with a simple weekly plan to reach new prospects.',
        trainerNotes: bulletify([
          'Review the three-channel prospecting cheat sheet.',
          'Walk the group through a live LinkedIn search.',
          'Build a “10 names in 10 minutes” action list.',
        ]),
        materialsNeeded: bulletify(['Prospecting worksheet', 'Sample messaging templates']),
        deliveryGuidance: 'Encourage leaders to share what’s already working before covering new tactics.',
        callToAction: 'Leaders pick one new recruiting channel to test this month.',
      },
      {
        title: 'Nail the Discovery Call',
        description: 'Structure, questions, and confident next steps that convert strong candidates.',
        durationMinutes: 35,
        learningOutcomes: 'Leaders can run a 20-minute discovery call that ends with a clear yes or next step.',
        trainerNotes: bulletify([
          'Demo a discovery call with an assistant trainer.',
          'Highlight the must-ask questions on the worksheet.',
          'Run mini role-plays and give quick feedback.',
        ]),
        materialsNeeded: bulletify(['Discovery call script', 'Objection flashcards', 'Checklist handout']),
        deliveryGuidance: 'Keep the role-plays high energy; cycle pairs quickly to maintain focus.',
        callToAction: 'Challenge leaders to book three discovery calls and log results in the tracker.',
      },
    ],
  };
};



const structureTemplates: Array<{
  id: string;
  name: string;
  description: string;
  topics: SessionTopicDraft[];
}> = [
  {
    id: 'workshop-3-block',
    name: 'Training Day (90 mins)',
    description: 'Open strong, teach new ideas, then apply them before wrapping.',
    topics: [
      {
        title: 'Kick-off & Focus',
        description: 'Warm the room, name the session promise, and surface what attendees hope to get.',
        durationMinutes: 15,
        learningOutcomes: 'Set the tone and align everyone on the one big win for this session.',
        trainerNotes: bulletify([
          'Run a quick icebreaker tied to the session theme.',
          'Share the session promise and write it where everyone can see.',
          'Capture one “must solve” question from the group.',
        ]),
        materialsNeeded: bulletify(['Timer', 'Whiteboard or slide with promise statement']),
        deliveryGuidance: 'Keep energy high—model the pace and tone you want for the rest of the workshop.',
        callToAction: 'Invite everyone to write one personal goal for the next 90 minutes.',
      },
      {
        title: 'Teach & Explore',
        description: 'Walk through the core concepts with stories, visuals, or demos.',
        durationMinutes: 40,
        learningOutcomes: 'Participants can describe the new ideas in plain language and connect them to their day-to-day.',
        trainerNotes: bulletify([
          'Explain each concept and tie it to a real story or example.',
          'Pause every 10 minutes for a “turn and teach” mini-share.',
          'Highlight the “watch outs” your team has already faced.',
        ]),
        materialsNeeded: bulletify(['Slides or visual aids', 'Concept cheat sheet']),
        deliveryGuidance: 'Keep the talk-to-interaction ratio balanced: aim for 5 minutes of teaching, then a quick engagement.',
        callToAction: 'Ask each table to pick the idea they want to start using this week.',
      },
      {
        title: 'Apply & Commit',
        description: 'Give them time to practice and leave with a clear next step.',
        durationMinutes: 25,
        learningOutcomes: 'Participants walk away knowing exactly what they will do first.',
        trainerNotes: bulletify([
          'Run a quick practice or role-play based on real scenarios.',
          'Guide a debrief: What worked? What needs tweaking?',
          'Have everyone write their first action in big letters.',
        ]),
        materialsNeeded: bulletify(['Practice scenarios', 'Commitment cards or sticky notes']),
        deliveryGuidance: 'Float between groups to coach; encourage concrete commitments.',
        callToAction: 'Close by asking everyone to share their first step with a partner.',
      },
    ],
  },
  {
    id: 'power-hour',
    name: 'Bootcamp Template (120 mins)',
    description: 'Fast-paced format for quick refreshers or focused coaching.',
    topics: [
      {
        title: 'Set the Stage',
        description: 'Connect to why this hour matters right now.',
        durationMinutes: 10,
        learningOutcomes: 'Participants know the goal for the hour and how it connects to today’s priorities.',
        trainerNotes: bulletify([
          'Share a quick story or metric that creates urgency.',
          'Invite the group to name one challenge they want to solve in the next 60 minutes.',
        ]),
        materialsNeeded: bulletify(['Flip chart or slide with key stat']),
        deliveryGuidance: 'Keep it tight—no more than two minutes on introductions.',
        callToAction: 'Ask everyone to jot a “win if…” statement on a sticky note.',
      },
      {
        title: 'Learn & Discuss',
        description: 'Surface one big insight and let the room react.',
        durationMinutes: 25,
        learningOutcomes: 'Participants can rewrite the insight in their own words and debate its impact.',
        trainerNotes: bulletify([
          'Teach the insight in three points.',
          'Open a guided discussion with two high-energy questions.',
          'Capture top ideas on a board.',
        ]),
        materialsNeeded: bulletify(['Discussion prompts slide', 'Markers / virtual board']),
        deliveryGuidance: 'Keep the conversation moving—redirect if someone dives too deep.',
        callToAction: 'Challenge the group to pick the insight they want to defend to a sceptic tomorrow.',
      },
      {
        title: 'Practice & Commit',
        description: 'Try it on and agree on the very next micro-step.',
        durationMinutes: 15,
        learningOutcomes: 'Participants leave knowing exactly what they will try today.',
        trainerNotes: bulletify([
          'Run a paired or small-group practice round.',
          'Share quick feedback prompts (“What landed? What would you tweak?”).',
          'End with a two-sentence commitment share.',
        ]),
        materialsNeeded: bulletify(['Practice worksheet', 'Timer']),
        deliveryGuidance: 'Keep practice rounds short—aim for two reps per person.',
        callToAction: 'Ask everyone to text themselves their first action before they leave.',
      },
    ],
  },
];

export const SessionMetadataForm: React.FC<SessionMetadataFormProps> = ({
  metadata,
  onChange,
  mode = 'guided',
}) => {
  const isClassic = mode === 'classic';
  const [audiences, setAudiences] = React.useState<Audience[]>([]);
  const [audiencesLoading, setAudiencesLoading] = React.useState(false);
  const [selectedPastTopics, setSelectedPastTopics] = React.useState<number[]>([]);
  const [tones, setTones] = React.useState<Tone[]>([]);
  const [tonesLoading, setTonesLoading] = React.useState(false);

  // Log topics whenever metadata changes
  React.useEffect(() => {
    if (metadata.topics && metadata.topics.length > 0) {
      console.log('[SessionMetadataForm] Rendering with topics:', metadata.topics);
    }
  }, [metadata.topics]);

  const handleStringChange = (field: keyof SessionMetadata) =>
    (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const value = event.target.value;
      onChange({ [field]: value } as Partial<SessionMetadata>);
    };

  const handleSessionTypeSelect = (sessionType: SessionMetadata['sessionType']) => {
    onChange({ sessionType });
  };

  const handleAudienceSelect = (audience: Audience) => {
    onChange({
      audienceId: audience.id,
      audienceName: audience.name,
    });
  };

  const handleAudienceClear = () => {
    onChange({
      audienceId: undefined,
      audienceName: undefined,
    });
  };

  const handleToneSelect = (tone: Tone) => {
    onChange({
      toneId: tone.id,
      toneName: tone.name,
    });
  };

  const handleToneClear = () => {
    onChange({
      toneId: undefined,
      toneName: undefined,
    });
  };

  // Load audiences
  React.useEffect(() => {
    const loadAudiences = async () => {
      try {
        setAudiencesLoading(true);
        const response = await audienceService.getAudiences({
          limit: 20,
          isActive: true,
        });
        setAudiences(response.audiences || []);
      } catch (error) {
        console.error('Failed to load audiences:', error);
      } finally {
        setAudiencesLoading(false);
      }
    };

    loadAudiences();
  }, []);

  // Load tones
  React.useEffect(() => {
    const loadTones = async () => {
      try {
        setTonesLoading(true);
        const response = await toneService.getTones({
          limit: 20,
          isActive: true,
        });
        setTones(response.tones || []);
      } catch (error) {
        console.error('Failed to load tones:', error);
      } finally {
        setTonesLoading(false);
      }
    };

    loadTones();
  }, []);

  
  // Calculate total duration from topics
  const totalDurationMinutes = React.useMemo(() => {
    if (!metadata.topics || metadata.topics.length === 0) return 0;
    return metadata.topics.reduce((sum, topic) => sum + (topic.durationMinutes || 0), 0);
  }, [metadata.topics]);

  // Auto-adjust end time when duration changes
  React.useEffect(() => {
    if (totalDurationMinutes > 0 && metadata.startTime) {
      const startDate = new Date(metadata.startTime);
      const newEndTime = new Date(startDate.getTime() + totalDurationMinutes * 60 * 1000);
      // Only update if end time is different to avoid infinite loops
      const currentEndTime = metadata.endTime ? new Date(metadata.endTime).getTime() : 0;
      if (Math.abs(newEndTime.getTime() - currentEndTime) > 60000) { // More than 1 minute difference
        onChange({ endTime: newEndTime.toISOString() });
      }
    }
  }, [totalDurationMinutes, metadata.startTime]); // Don't include metadata.endTime or onChange in dependencies

  // Set default start time to 7:00pm tomorrow on first load
  React.useEffect(() => {
    if (!metadata.startTime || !metadata.startDate) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(19, 0, 0, 0); // 7:00 PM

      onChange({
        startDate: tomorrow.toISOString().slice(0, 10),
        startTime: tomorrow.toISOString(),
        endTime: new Date(tomorrow.getTime() + 90 * 60 * 1000).toISOString(), // Default 1.5 hours (8:30 PM)
      });
    }
  }, []); // Only run once on mount

  

  return (
    <div className="space-y-6">


      {/* Section 1: Set Your Goal */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <CardTitle className="text-base font-semibold">
              📚 Choose your subject area
            </CardTitle>
          </div>
          <p className="text-sm text-slate-600 mt-1">
            Pick the category that best fits your training topic
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Category - Full Width Row */}
          <div className="space-y-2">
            <label htmlFor="session-category" className="text-sm font-medium text-slate-700 flex items-center gap-1">
              Which subject area fits best? <span className="text-red-500">*</span>
            </label>
            <CategorySelect
              value={metadata.categoryId ?? ''}
              selectedLabel={metadata.category}
              onChange={(categoryId) => {
                if (!categoryId) {
                  onChange({ categoryId: undefined, category: '' });
                }
              }}
              onCategoryChange={(category) => {
                onChange({
                  categoryId: category?.id ?? undefined,
                  category: category?.name ?? '',
                });
              }}
              placeholder="Select a category..."
              required={true}
              onError={(error) => console.error('Category error:', error)}
            />
            <p className="text-xs text-slate-500">
              This helps me create content that matches your subject area
            </p>
          </div>

  
  
  
          </CardContent>
      </Card>

      {/* Section 2: What format will this take? */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <CardTitle className="text-base font-semibold">
              🎯 How will you deliver this training?
            </CardTitle>
          </div>
          <p className="text-sm text-slate-600 mt-1">
            Select the delivery style that works best for your audience
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {sessionTypes.map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => handleSessionTypeSelect(type)}
                className={cn(
                  'p-4 text-left border rounded-lg transition-all hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500',
                  metadata.sessionType === type
                    ? 'border-blue-500 bg-blue-50 text-blue-900'
                    : 'border-slate-200 hover:border-slate-300 text-slate-700 hover:bg-slate-50'
                )}
              >
                <div className="font-medium capitalize">
                  {type}
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  {type === 'workshop' && 'Hands-on learning session'}
                  {type === 'training' && 'Skill development focused'}
                  {type === 'event' && 'Special gathering or occasion'}
                  {type === 'webinar' && 'Online presentation format'}
                </div>
              </button>
            ))}
          </div>
          <p className="text-xs text-slate-500">
            Select the session format that works best for your content and audience.
          </p>
        </CardContent>
      </Card>

      {/* Section 3: Who is this session for? */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <CardTitle className="text-base font-semibold">
              👥 Who will be attending?
            </CardTitle>
          </div>
          <p className="text-sm text-slate-600 mt-1">
            Choose the audience group to personalize the content
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {audiencesLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="p-4 border border-slate-200 rounded-lg animate-pulse">
                  <div className="h-4 bg-slate-200 rounded mb-2"></div>
                  <div className="h-3 bg-slate-100 rounded"></div>
                </div>
              ))}
            </div>
          ) : audiences.length > 0 ? (
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {audiences.map((audience) => (
                  <button
                    key={audience.id}
                    type="button"
                    onClick={() => handleAudienceSelect(audience)}
                    className={cn(
                      'p-4 text-left border rounded-lg transition-all hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500',
                      metadata.audienceId === audience.id
                        ? 'border-blue-500 bg-blue-50 text-blue-900'
                        : 'border-slate-200 hover:border-slate-300 text-slate-700 hover:bg-slate-50'
                    )}
                  >
                    <div className="font-medium">{audience.name}</div>
                    {audience.description && (
                      <div className="text-xs text-slate-500 mt-1 line-clamp-2">{audience.description}</div>
                    )}
                  </button>
                ))}
              </div>
              {metadata.audienceId && (
                <button
                  type="button"
                  onClick={handleAudienceClear}
                  className="text-xs text-slate-500 hover:text-slate-700 underline"
                >
                  Clear selection
                </button>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <svg className="w-12 h-12 text-slate-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <p className="text-sm text-slate-500">No audiences available</p>
            </div>
          )}
          <p className="text-xs text-slate-500">
            Optional — select a specific audience to personalize the content
          </p>
        </CardContent>
      </Card>

      {/* Section 4: What are the goals? */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <CardTitle className="text-base font-semibold">
              🎯 What should people be able to do after this session?
            </CardTitle>
          </div>
          <p className="text-sm text-slate-600 mt-1">
            Describe the skills or behaviors you want to develop
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Desired Outcome */}
          <div className="space-y-2">
            <label htmlFor="session-desired-outcome" className="text-sm font-medium text-slate-700 flex items-center gap-1">
              What's the main skill they'll learn? <span className="text-red-500">*</span>
            </label>
            <textarea
              id="session-desired-outcome"
              className="min-h-[80px] w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              value={metadata.desiredOutcome}
              placeholder="Example: give clear feedback using the SBI method within 10 minutes"
              onChange={handleStringChange('desiredOutcome')}
              rows={3}
            />
            <p className="text-xs text-slate-500">
              Be specific - this guides the entire session content
            </p>
          </div>

          {/* Current Problem or Challenge */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">
              What challenge are they facing right now?
            </label>
            <textarea
              className="min-h-[80px] w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              value={metadata.currentProblem}
              placeholder="Example: managers avoid hard talks because they worry about hurting morale"
              onChange={handleStringChange('currentProblem')}
              rows={3}
            />
            <p className="text-xs text-slate-500">
              Optional: This helps create relevant examples and scenarios
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Section 5: Choose What You'll Cover */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <CardTitle className="text-base font-semibold">
              💡 Get inspired by your past successes
            </CardTitle>
          </div>
          <p className="text-sm text-slate-600 mt-1">
            {isClassic
              ? 'Select topics from your previous successful sessions to build on what works'
              : 'Optional: Choose topics you\'ve used before to inspire better content'}
          </p>
        </CardHeader>
        <CardContent className="space-y-4">

          {/* Past Topics Inspiration */}
          {!isClassic && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">
                Your successful topics from the past
              </label>

              {metadata.categoryId ? (
                <div className="space-y-3">
                  <div className="text-sm text-slate-600">
                    Here are your most successful {metadata.category} topics:
                  </div>

                  {/* Sample past topics - would be fetched from API */}
                  <div className="space-y-2">
                    {getPastTopicsByCategory(metadata.categoryId).map((topic) => (
                      <div key={topic.id} className="flex items-start gap-3 p-3 border border-slate-200 rounded-lg hover:bg-slate-50">
                        <input
                          type="checkbox"
                          id={`topic-${topic.id}`}
                          className="mt-1 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                          checked={selectedPastTopics?.includes(topic.id) || false}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedPastTopics([...(selectedPastTopics || []), topic.id]);
                            } else {
                              setSelectedPastTopics((selectedPastTopics || []).filter(id => id !== topic.id));
                            }
                          }}
                        />
                        <div className="flex-1">
                          <label htmlFor={`topic-${topic.id}`} className="font-medium text-slate-900 cursor-pointer">
                            {topic.title}
                          </label>
                          <div className="text-xs text-slate-500 mt-1">
                            ⭐ Used {topic.usageCount} times • {topic.rating}
                          </div>
                          {topic.context && (
                            <div className="text-xs text-slate-600 mt-1 italic">
                              Why it worked: {topic.context}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {selectedPastTopics && selectedPastTopics.length > 0 && (
                    <div className="text-xs text-blue-600">
                      ✓ {selectedPastTopics.length} topic{selectedPastTopics.length > 1 ? 's' : ''} selected to inspire better content
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-sm text-slate-500 italic">
                  Choose a subject area first to see your past successes
                </div>
              )}
            </div>
          )}

  
          {/* Duration Display */}
          {totalDurationMinutes > 0 && (
            <div className="rounded-lg border border-amber-300 bg-amber-50 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <svg className="h-5 w-5 text-amber-700" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <span className="text-sm font-semibold text-amber-900">Total Duration: {totalDurationMinutes} minutes</span>
                    <p className="text-xs text-amber-700 mt-0.5">
                      Based on your topic durations. This will set your session end time.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Section 6: Plan When & Where */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <CardTitle className="text-base font-semibold">
              🕒 Schedule your session
            </CardTitle>
          </div>
          <p className="text-sm text-slate-600 mt-1">
            Set the date, time, location, and tone for your training
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">

            {/* Session Location */}
            <div className="space-y-2 sm:col-span-3">
              <label className="text-sm font-medium text-slate-700 flex items-center gap-1">
                Where will this training take place? <span className="text-red-500">*</span>
              </label>
              <LocationSelect
                value={metadata.locationId ?? ''}
                selectedLabel={metadata.location}
                data-testid="location-select"
                onChange={(location) => {
                  onChange({
                    locationId: location?.id ?? undefined,
                    location: location?.name ?? '',
                    locationType: location?.locationType ?? undefined,
                    meetingPlatform: location?.meetingPlatform ?? undefined,
                    locationCapacity: location?.capacity ?? undefined,
                    locationTimezone: location?.timezone ?? undefined,
                    locationNotes: location ? (location.notes ?? location.accessInstructions ?? undefined) : undefined,
                  });
                }}
                required
              />
              <p className="text-xs text-slate-500">
                Choose from your approved locations and meeting spaces
              </p>
            </div>
          </div>

          {/* Date and Time Row */}
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">
                When will this happen?
              </label>
              <Input
                type="date"
                value={toDateInputValue(metadata.startDate)}
                onChange={(event) => {
                  const newDate = event.target.value;
                  const currentStartTime = timeSegment(metadata.startTime);
                  const currentEndTime = timeSegment(metadata.endTime);

                  onChange({
                    startDate: newDate,
                    startTime: fromDateTimeLocal(`${newDate}T${currentStartTime}`),
                    endTime: fromDateTimeLocal(`${newDate}T${currentEndTime}`)
                  });
                }}
                min={new Date().toISOString().split('T')[0]}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">
                What time does it start?
              </label>
              <Input
                type="time"
                value={timeSegment(metadata.startTime)}
                onChange={(event) => {
                  const newTime = event.target.value;
                  onChange({
                    startTime: fromDateTimeLocal(`${metadata.startDate}T${newTime}`)
                  });
                }}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">
                What time does it end?
              </label>
              <Input
                type="time"
                value={timeSegment(metadata.endTime)}
                onChange={(event) => {
                  const newTime = event.target.value;
                  onChange({
                    endTime: fromDateTimeLocal(`${metadata.startDate}T${newTime}`)
                  });
                }}
              />
              <p className="text-xs text-slate-500">
                Automatically calculated, but you can adjust if needed
              </p>
            </div>
          </div>

          </CardContent>
      </Card>

      {/* Section 7: What tone should this have? */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <CardTitle className="text-base font-semibold">
              🎨 What tone should this have?
            </CardTitle>
          </div>
          <p className="text-sm text-slate-600 mt-1">
            Choose the communication style that best fits your audience and content
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {tonesLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="p-4 border border-slate-200 rounded-lg animate-pulse">
                  <div className="h-4 bg-slate-200 rounded mb-2"></div>
                  <div className="h-3 bg-slate-100 rounded"></div>
                </div>
              ))}
            </div>
          ) : tones.length > 0 ? (
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {tones.map((tone) => (
                  <button
                    key={tone.id}
                    type="button"
                    onClick={() => handleToneSelect(tone)}
                    className={cn(
                      'p-4 text-left border rounded-lg transition-all hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500',
                      metadata.toneId === tone.id
                        ? 'border-blue-500 bg-blue-50 text-blue-900'
                        : 'border-slate-200 hover:border-slate-300 text-slate-700 hover:bg-slate-50'
                    )}
                  >
                    <div className="font-medium">{tone.name}</div>
                    <div className="text-xs text-slate-500 mt-1 line-clamp-2">{tone.description}</div>
                  </button>
                ))}
              </div>
              {metadata.toneId && (
                <button
                  type="button"
                  onClick={handleToneClear}
                  className="text-xs text-slate-500 hover:text-slate-700 underline"
                >
                  Clear selection
                </button>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <svg className="w-12 h-12 text-slate-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
              </svg>
              <p className="text-sm text-slate-500">No tones available</p>
            </div>
          )}
          <p className="text-xs text-slate-500">
            Optional: This affects how your content sounds and feels
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
