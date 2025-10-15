import * as React from 'react';
import { Input, Card, CardContent, CardHeader, CardTitle, Button } from '../../../ui';
import { SessionMetadata, SessionTopicDraft } from '../state/types';
import { TopicInputRepeater } from './TopicInputRepeater';
import { cn } from '../../../lib/utils';
import { CategorySelect } from '@/components/ui/CategorySelect';
import { LocationSelect } from '@/components/ui/LocationSelect';
import { AudienceSelect } from '@/components/ui/AudienceSelect';
import { ToneSelect } from '@/components/ui/ToneSelect';

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


// Field validation helper
const getFieldValidation = (
  field: keyof SessionMetadata,
  value: SessionMetadata[keyof SessionMetadata],
) => {
  const requiredFields: (keyof SessionMetadata)[] = ['desiredOutcome', 'categoryId', 'sessionType', 'locationId'];
  const isRequired = requiredFields.includes(field);
  const isEmpty =
    value === undefined ||
    value === null ||
    (typeof value === 'string' && value.trim() === '') ||
    (typeof value === 'number' && Number.isNaN(value));

  return {
    isRequired,
    isEmpty,
    isValid: !isRequired || !isEmpty,
    errorMessage: isRequired && isEmpty ? `${field} is required` : '',
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
  const [fieldErrors, setFieldErrors] = React.useState<Record<string, string>>({});
  const [showAdvancedFields, setShowAdvancedFields] = React.useState(false);
  const [showTopicsSection, setShowTopicsSection] = React.useState(false);
  const [showLogisticsSection, setShowLogisticsSection] = React.useState(false);

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

      // Clear error when user starts typing
      if (fieldErrors[field]) {
        setFieldErrors(prev => ({ ...prev, [field]: '' }));
      }
    };

  const handleSessionTypeChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const rawValue = event.target.value as SessionMetadata['sessionType'] | '';
    const nextValue = rawValue ? (rawValue as SessionMetadata['sessionType']) : null;
    onChange({ sessionType: nextValue });

    if (fieldErrors.sessionType) {
      setFieldErrors(prev => ({ ...prev, sessionType: '' }));
    }
  };

  // Calculate required fields completion
  const requiredFields = {
    desiredOutcome: !!metadata.desiredOutcome?.trim(),
    categoryId: !!metadata.categoryId,
    sessionType: !!metadata.sessionType,
    locationId: !!metadata.locationId,
  };
  const completedRequired = Object.values(requiredFields).filter(Boolean).length;
  const totalRequired = Object.keys(requiredFields).length;

  // Progressive reveal logic - show advanced fields when initial 2 are complete
  const initialFieldsComplete = React.useMemo(() => {
    return !!metadata.categoryId && !!metadata.sessionType;
  }, [metadata.categoryId, metadata.sessionType]);

  React.useEffect(() => {
    if (initialFieldsComplete && !showAdvancedFields) {
      setShowAdvancedFields(true);
    }
  }, [initialFieldsComplete, showAdvancedFields]);

  // Show Topics section when core fields are complete
  const section1CoreComplete = React.useMemo(() => {
    return !!metadata.desiredOutcome?.trim() &&
           !!(metadata.audienceId || metadata.audienceName);
  }, [metadata.desiredOutcome, metadata.audienceId, metadata.audienceName]);

  React.useEffect(() => {
    if (section1CoreComplete && !showTopicsSection) {
      setShowTopicsSection(true);
    }
  }, [section1CoreComplete, showTopicsSection]);

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
        endTime: new Date(tomorrow.getTime() + 60 * 60 * 1000).toISOString(), // Default 1 hour
      });
    }
  }, []); // Only run once on mount

  // Show Logistics section when core requirements are met
  React.useEffect(() => {
    const hasDesiredOutcome = !!metadata.desiredOutcome?.trim();
    const hasAudience = !!(metadata.audienceId || metadata.audienceName);

    if (hasDesiredOutcome && hasAudience && !showLogisticsSection) {
      setShowLogisticsSection(true);
    }
  }, [metadata.desiredOutcome, metadata.audienceId, metadata.audienceName, showLogisticsSection]);

  const handleFillTestData = () => {
    const testData = generateTestData();
    onChange(testData);
  };

  const handleFillTopicTestData = () => {
    const testDataWithTopics = generateTestDataWithTopics();
    onChange(testDataWithTopics);
  };

  return (
    <div className="space-y-6">
      {/* Development Test Data Button */}
      {process.env.NODE_ENV === 'development' && (
        <div className="flex justify-end gap-2">
          <Button
            type="button"
            onClick={handleFillTestData}
            variant="outline"
            size="sm"
            className="bg-purple-50 border-purple-300 text-purple-700 hover:bg-purple-100 hover:border-purple-400"
          >
            <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
            </svg>
            Fill Leadership Test Data
          </Button>
          <Button
            type="button"
            onClick={handleFillTopicTestData}
            variant="outline"
            size="sm"
            className="bg-blue-50 border-blue-300 text-blue-700 hover:bg-blue-100 hover:border-blue-400"
          >
            <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8c1.105 0 2-.672 2-1.5S13.105 5 12 5s-2 .672-2 1.5S10.895 8 12 8zm0 4c1.105 0 2-.672 2-1.5S13.105 9 12 9s-2 .672-2 1.5S10.895 12 12 12zm0 4c1.105 0 2-.672 2-1.5s-.895-1.5-2-1.5-2 .672-2 1.5.895 1.5 2 1.5z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 7h.01M18 7h.01M6 11h.01M18 11h.01M6 15h.01M18 15h.01"
              />
            </svg>
            Fill Sales Enablement Data
          </Button>
          <Button
            type="button"
            onClick={() => onChange(generateRecruitingAgentsData())}
            variant="outline"
            size="sm"
            className="bg-amber-50 border-amber-300 text-amber-700 hover:bg-amber-100 hover:border-amber-400"
          >
            <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Fill Recruiting Test Data
          </Button>
        </div>
      )}

      {/* Progress Indicator */}
      {completedRequired < totalRequired && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-blue-900">
                {completedRequired} of {totalRequired} required fields complete
              </h3>
              <p className="text-xs text-blue-700 mt-1">
                Fill in the required fields to continue to the next step
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Section 1: Set Your Goal */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <CardTitle className="text-base font-semibold">
              🎯 Set Your Goal
            </CardTitle>
          </div>
          <p className="text-sm text-slate-600 mt-1">
            Start with the basics — what will you cover and who's it for?
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Initial 3 fields - always visible */}
          <div className="grid gap-4 sm:grid-cols-2">
            {/* Category */}
            <div className="space-y-2">
              <label htmlFor="session-category" className="text-sm font-medium text-slate-700 flex items-center gap-1">
                Category <span className="text-red-500">*</span>
                {requiredFields.categoryId && (
                  <svg className="h-4 w-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                )}
              </label>
              <CategorySelect
                value={metadata.categoryId ?? ''}
                selectedLabel={metadata.category}
                onChange={(categoryId) => {
                  if (!categoryId) {
                    onChange({ categoryId: undefined, category: '' });
                    if (fieldErrors.categoryId) {
                      setFieldErrors(prev => ({ ...prev, categoryId: '' }));
                    }
                  }
                }}
                onCategoryChange={(category) => {
                  onChange({
                    categoryId: category?.id ?? undefined,
                    category: category?.name ?? '',
                  });
                  if (fieldErrors.categoryId) {
                    setFieldErrors(prev => ({ ...prev, categoryId: '' }));
                  }
                }}
                placeholder="Select or create category..."
                className={cn(
                  fieldErrors.categoryId && 'border-red-500 focus:border-red-500'
                )}
                allowCreate={true}
                required={true}
                onError={(error) => console.error('Category error:', error)}
              />
              {fieldErrors.categoryId && (
                <p className="text-xs text-red-600">{fieldErrors.categoryId}</p>
              )}
              <p className="text-xs text-slate-500">
                What subject area does this cover?
              </p>
            </div>

            {/* Session Type */}
            <div className="space-y-2">
              <label htmlFor="session-type" className="text-sm font-medium text-slate-700 flex items-center gap-1">
                Session Type <span className="text-red-500">*</span>
                {requiredFields.sessionType && (
                  <svg className="h-4 w-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                )}
              </label>
              <div className="relative">
                <select
                  id="session-type"
                  aria-invalid={!!fieldErrors.sessionType}
                  className={cn(
                    'h-10 w-full appearance-none rounded-md border border-slate-200 bg-white px-3 pr-10 text-sm font-medium text-slate-700 shadow-sm transition',
                    'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
                    'disabled:cursor-not-allowed disabled:opacity-60',
                    fieldErrors.sessionType && 'border-red-500 focus:border-red-500 focus:ring-red-500',
                    !metadata.sessionType && 'text-slate-400 font-normal'
                  )}
                  value={metadata.sessionType ?? ''}
                  onChange={handleSessionTypeChange}
                >
                  <option value="">Select a session type...</option>
                  {sessionTypes.map((type) => (
                    <option key={type} value={type}>
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </option>
                  ))}
                </select>
                <svg
                  className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                  aria-hidden="true"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
              {fieldErrors.sessionType && (
                <p className="text-xs text-red-600">{fieldErrors.sessionType}</p>
              )}
              <p className="text-xs text-slate-500">
                What format will this take?
              </p>
            </div>

            {/* Session Title */}
            <div className="space-y-2 sm:col-span-2">
              <label htmlFor="session-title" className="text-sm font-medium text-slate-700">
                What will you call this session?
              </label>
              <Input
                id="session-title"
                value={metadata.title}
                placeholder="Example: Coaching Through Change"
                onChange={handleStringChange('title')}
                className={cn(
                  fieldErrors.title && 'border-red-500 focus:border-red-500'
                )}
              />
              {fieldErrors.title && (
                <p className="text-xs text-red-600">{fieldErrors.title}</p>
              )}
              <p className="text-xs text-slate-500">
                Optional — give it a name after you've defined the goal
              </p>
            </div>
          </div>

          {/* Progressive reveal - remaining fields */}
          <div
            className={cn(
              'transition-all duration-300 ease-in-out',
              showAdvancedFields ? 'max-h-[2000px] opacity-100 overflow-visible' : 'max-h-0 opacity-0 overflow-hidden'
            )}
          >
            <div className="grid gap-4 sm:grid-cols-2 pt-4">
              {/* Desired Outcome */}
              <div className="space-y-2 sm:col-span-2">
                <label htmlFor="session-desired-outcome" className="text-sm font-medium text-slate-700 flex items-center gap-1">
                  What should people be able to do after? <span className="text-red-500">*</span>
                  {requiredFields.desiredOutcome && (
                    <svg className="h-4 w-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  )}
                </label>
                <textarea
                  id="session-desired-outcome"
                  className={cn(
                    'min-h-[80px] w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none',
                    fieldErrors.desiredOutcome && 'border-red-500 focus:border-red-500'
                  )}
                  value={metadata.desiredOutcome}
                  placeholder="Example: give clear feedback using the SBI method within 10 minutes"
                  onChange={handleStringChange('desiredOutcome')}
                  rows={3}
                />
                {fieldErrors.desiredOutcome && (
                  <p className="text-xs text-red-600">{fieldErrors.desiredOutcome}</p>
                )}
                <p className="text-xs text-slate-500">
                  One or two sentences that describe the new action or skill
                </p>
              </div>

              {/* Current Problem or Challenge */}
              <div className="space-y-2 sm:col-span-2">
                <label className="text-sm font-medium text-slate-700">
                  What problem are people facing today?
                </label>
                <textarea
                  className="min-h-[80px] w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  value={metadata.currentProblem}
                  placeholder="Example: managers avoid hard talks because they worry about hurting morale"
                  onChange={handleStringChange('currentProblem')}
                  rows={3}
                />
                <p className="text-xs text-slate-500">
                  Optional, but helps us suggest better stories and examples
                </p>
              </div>

              {/* Target Audience */}
              <div className="space-y-2 sm:col-span-2">
                <label className="text-sm font-medium text-slate-700">
                  Target Audience
                </label>
                <AudienceSelect
                  value={metadata.audienceId ?? ''}
                  selectedLabel={metadata.audienceName}
                  onChange={(audience) => {
                    onChange({
                      audienceId: audience?.id ?? undefined,
                      audienceName: audience?.name ?? undefined,
                    });
                  }}
                />
                <p className="text-xs text-slate-500">
                  Optional — tailor the session for a specific group
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Section 2: Choose What You'll Cover - Progressive reveal */}
      <div
        className={cn(
          'transition-all duration-300 ease-in-out',
          showTopicsSection ? 'max-h-[3000px] opacity-100 overflow-visible' : 'max-h-0 opacity-0 overflow-hidden'
        )}
      >
        <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <CardTitle className="text-base font-semibold">
              📚 {isClassic ? 'Choose What You\'ll Cover' : 'Choose What You\'ll Cover (Optional)'}
            </CardTitle>
          </div>
          <p className="text-sm text-slate-600 mt-1">
            {isClassic
              ? 'Select the topics you will cover in this session. Choose items from your library or add new custom topics.'
              : 'This entire section is optional. If you want me to take certain topics into consideration when generating content'}
          </p>
        </CardHeader>
        <CardContent className="space-y-4">

          {/* Simple Topic List */}
          {!isClassic && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">
                Quick topic list (optional)
              </label>
              <textarea
                className="min-h-[60px] w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                value={metadata.specificTopics}
                placeholder="Example: trust-building, root-cause questions, one-page action plans"
                onChange={handleStringChange('specificTopics')}
                rows={2}
              />
              <p className="text-xs text-slate-500">
                Comma-separated list for a quick overview
              </p>
            </div>
          )}

          {/* Detailed Topics Section */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">
              {isClassic ? 'Add detailed topics' : 'Add detailed topics (optional)'}
            </label>


            {/* Topic Repeater */}
            <TopicInputRepeater
              topics={metadata.topics || []}
              onChange={(topics) => onChange({ topics })}
              mode={mode}
            />
            <p className="text-xs text-slate-500">
              Include learning outcomes, trainer notes, materials, and delivery guidance for each topic
            </p>
          </div>

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
      </div>

      {/* Section 3: Plan When & Where - Progressive reveal */}
      <div
        className={cn(
          'transition-all duration-300 ease-in-out',
          showLogisticsSection ? 'max-h-[2000px] opacity-100 overflow-visible' : 'max-h-0 opacity-0 overflow-hidden'
        )}
      >
        <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <CardTitle className="text-base font-semibold">
              🕒 Plan When & Where
            </CardTitle>
          </div>
          <p className="text-sm text-slate-600 mt-1">
            When and where will this happen?
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">

            {/* Session Location */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 flex items-center gap-1">
                Where will you host it? <span className="text-red-500">*</span>
                {requiredFields.locationId && (
                  <svg className="h-4 w-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                )}
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
                  if (fieldErrors.locationId) {
                    setFieldErrors(prev => ({ ...prev, locationId: '' }));
                  }
                }}
                hasError={Boolean(fieldErrors.locationId)}
                required
              />
              {fieldErrors.locationId && (
                <p className="text-xs text-red-600">{fieldErrors.locationId}</p>
              )}
              <p className="text-xs text-slate-500">
                Pick an approved room, link, or meeting space
              </p>
            </div>
          </div>

          {/* Date and Time Row */}
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">
                Pick a date
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
                Start time
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
                End time
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
                Auto-set from topic durations, but you can override
              </p>
            </div>
          </div>

          {/* Session Tone */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">
                How should it sound?
              </label>
              <ToneSelect
                value={metadata.toneId ?? ''}
                selectedLabel={metadata.toneName}
                onChange={(tone) => {
                  onChange({
                    toneId: tone?.id ?? undefined,
                    toneName: tone?.name ?? undefined,
                  });
                }}
              />
              <p className="text-xs text-slate-500">
                Optional — pick a voice to guide the wording
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
      </div>
    </div>
  );
};
