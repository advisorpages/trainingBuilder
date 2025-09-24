import { FlexibleSessionSection, SectionType, sessionBuilderService } from '../services/session-builder.service';

export interface SectionTypeConfig {
  type: SectionType;
  name: string;
  icon: string;
  description: string;
  defaultDuration: number;
  requiredFields: (keyof FlexibleSessionSection)[];
  availableFields: (keyof FlexibleSessionSection)[];
}

export function getSectionTypeConfigs(): Record<SectionType, SectionTypeConfig> {
  return {
    opener: {
      type: 'opener',
      name: 'Opening',
      icon: '🎯',
      description: 'Session introduction and icebreaker',
      defaultDuration: 10,
      requiredFields: ['title', 'description', 'duration'],
      availableFields: ['learningObjectives', 'trainerNotes'] as any
    },
    topic: {
      type: 'topic',
      name: 'Topic',
      icon: '📚',
      description: 'Educational content and learning material',
      defaultDuration: 25,
      requiredFields: ['title', 'description', 'duration'],
      availableFields: ['learningObjectives', 'suggestedActivities', 'materialsNeeded', 'learningOutcomes', 'trainerNotes', 'deliveryGuidance', 'trainerId', 'trainerName', 'speakerDuration'] as any
    },
    exercise: {
      type: 'exercise',
      name: 'Interactive Exercise',
      icon: '🎮',
      description: 'Hands-on activities and exercises',
      defaultDuration: 20,
      requiredFields: ['title', 'description', 'duration', 'exerciseType'] as any,
      availableFields: ['exerciseInstructions', 'materialsNeeded', 'engagementType', 'learningObjectives', 'trainerNotes'] as any
    },
    video: {
      type: 'video',
      name: 'Video',
      icon: '🎥',
      description: 'Video presentations or media',
      defaultDuration: 15,
      requiredFields: ['title', 'description', 'duration'] as any,
      availableFields: ['mediaUrl', 'mediaDuration', 'suggestions', 'trainerNotes'] as any
    },
    discussion: {
      type: 'discussion',
      name: 'Discussion',
      icon: '💬',
      description: 'Group discussions and Q&A',
      defaultDuration: 15,
      requiredFields: ['title', 'description', 'duration'] as any,
      availableFields: ['discussionPrompts', 'engagementType', 'learningObjectives', 'trainerNotes'] as any
    },
    presentation: {
      type: 'presentation',
      name: 'Presentation',
      icon: '🎤',
      description: 'Formal presentations and speeches',
      defaultDuration: 20,
      requiredFields: ['title', 'description', 'duration'] as any,
      availableFields: ['learningObjectives', 'materialsNeeded', 'trainerNotes', 'deliveryGuidance', 'trainerId', 'trainerName', 'speakerDuration'] as any
    },
    inspiration: {
      type: 'inspiration',
      name: 'Inspiration',
      icon: '✨',
      description: 'Motivational content and stories',
      defaultDuration: 10,
      requiredFields: ['title', 'description', 'duration'] as any,
      availableFields: ['inspirationType', 'suggestions', 'mediaUrl', 'trainerNotes'] as any
    },
    break: {
      type: 'break',
      name: 'Break',
      icon: '☕',
      description: 'Rest and networking break',
      defaultDuration: 15,
      requiredFields: ['title', 'duration'] as any,
      availableFields: ['description', 'trainerNotes'] as any
    },
    assessment: {
      type: 'assessment',
      name: 'Assessment',
      icon: '📋',
      description: 'Knowledge checks and evaluations',
      defaultDuration: 10,
      requiredFields: ['title', 'description', 'duration', 'assessmentType'] as any,
      availableFields: ['assessmentCriteria', 'trainerNotes', 'deliveryGuidance'] as any
    },
    closing: {
      type: 'closing',
      name: 'Closing',
      icon: '🏁',
      description: 'Session wrap-up and next steps',
      defaultDuration: 10,
      requiredFields: ['title', 'description', 'duration'] as any,
      availableFields: ['keyTakeaways', 'actionItems', 'nextSteps', 'trainerNotes'] as any
    },
    custom: {
      type: 'custom',
      name: 'Custom',
      icon: '⚙️',
      description: 'Custom content section',
      defaultDuration: 15,
      requiredFields: ['title', 'description', 'duration'] as any,
      availableFields: ['learningObjectives', 'materialsNeeded', 'trainerNotes', 'deliveryGuidance'] as any
    }
  } as Record<SectionType, SectionTypeConfig>;
}

export function getSectionTypeOptions(): { value: SectionType; label: string; icon: string }[] {
  const cfg = getSectionTypeConfigs();
  return (Object.keys(cfg) as SectionType[]).map((k) => ({ value: k, label: cfg[k].name, icon: cfg[k].icon }));
}

const COMMON_FIELDS: (keyof FlexibleSessionSection)[] = [
  'id', 'type', 'position', 'title', 'duration', 'description', 'isRequired', 'isCollapsible', 'icon',
  'createdAt', 'updatedAt', 'isTemplate', 'templateId'
];

export function convertSection(section: FlexibleSessionSection, newType: SectionType): FlexibleSessionSection {
  if (section.type === newType) return section;
  const configs = getSectionTypeConfigs();
  const toCfg = configs[newType];

  // Start with preserved common fields
  const base: FlexibleSessionSection = {
    id: section.id,
    type: newType,
    position: section.position,
    title: section.title,
    duration: section.duration || toCfg.defaultDuration,
    description: section.description || `Add description for ${toCfg.name}`,
    isRequired: newType === 'opener' || newType === 'closing' ? true : section.isRequired,
    isCollapsible: section.isCollapsible !== undefined ? section.isCollapsible : true,
    icon: toCfg.icon,
    createdAt: section.createdAt,
    updatedAt: new Date().toISOString(),
  } as FlexibleSessionSection;

  // Preserve overlapping optional arrays/fields if still available on new type
  const candidateFields: (keyof FlexibleSessionSection)[] = [
    'learningObjectives','suggestedActivities','materialsNeeded','learningOutcomes','trainerNotes','deliveryGuidance',
    'exerciseInstructions','exerciseType','engagementType','discussionPrompts',
    'inspirationType','mediaUrl','mediaDuration','suggestions',
    'keyTakeaways','actionItems','nextSteps','trainerId','trainerName','speakerDuration',
    'assessmentType','assessmentCriteria'
  ];

  const allowed = new Set<keyof FlexibleSessionSection>([...COMMON_FIELDS, ...toCfg.requiredFields, ...toCfg.availableFields]);
  for (const f of candidateFields) {
    if (allowed.has(f) && (section as any)[f] !== undefined) {
      (base as any)[f] = (section as any)[f];
    }
  }

  // Ensure minimal defaults for target type
  switch (newType) {
    case 'exercise':
      base.isExercise = true;
      if (!base.exerciseType) base.exerciseType = 'activity';
      break;
    case 'discussion':
      if (!base.engagementType) base.engagementType = 'full-group';
      break;
    case 'video':
      if (!base.inspirationType) base.inspirationType = 'video';
      break;
    case 'opener':
      base.isRequired = true;
      break;
    case 'closing':
      base.isRequired = true;
      if (!base.keyTakeaways) base.keyTakeaways = [];
      if (!base.actionItems) base.actionItems = [];
      break;
  }

  return base;
}

export function addSectionLocal(
  outline: { sections: FlexibleSessionSection[]; totalDuration: number },
  type: SectionType,
  position?: number
) {
  const pos = position && position > 0 ? position : outline.sections.length + 1;
  const newSection = sessionBuilderService.createDefaultSection(type, pos);
  const sections = [...outline.sections];
  sections.splice(pos - 1, 0, newSection);
  const renumbered = sections.map((s, idx) => ({ ...s, position: idx + 1 }));
  return {
    ...outline,
    sections: renumbered,
    totalDuration: sessionBuilderService.calculateTotalDuration(renumbered)
  };
}

export function removeSectionLocal(outline: { sections: FlexibleSessionSection[]; totalDuration: number }, sectionId: string) {
  const kept = outline.sections.filter((s) => s.id !== sectionId);
  const renumbered = kept.map((s, idx) => ({ ...s, position: idx + 1 }));
  return {
    ...outline,
    sections: renumbered,
    totalDuration: sessionBuilderService.calculateTotalDuration(renumbered)
  };
}

export function moveSectionLocal(outline: { sections: FlexibleSessionSection[]; totalDuration: number }, sectionId: string, direction: 'up' | 'down') {
  const idx = outline.sections.findIndex((s) => s.id === sectionId);
  if (idx < 0) return outline;
  const target = direction === 'up' ? idx - 1 : idx + 1;
  if (target < 0 || target >= outline.sections.length) return outline;
  const sections = [...outline.sections];
  const [item] = sections.splice(idx, 1);
  sections.splice(target, 0, item);
  const renumbered = sections.map((s, i) => ({ ...s, position: i + 1, updatedAt: new Date().toISOString() }));
  return {
    ...outline,
    sections: renumbered,
    totalDuration: sessionBuilderService.calculateTotalDuration(renumbered)
  };
}

export function duplicateSectionLocal(outline: { sections: FlexibleSessionSection[]; totalDuration: number }, sectionId: string) {
  const idx = outline.sections.findIndex((s) => s.id === sectionId);
  if (idx < 0) return outline;
  const original = outline.sections[idx];
  const copy: FlexibleSessionSection = {
    ...original,
    id: `${original.id}-copy-${Date.now()}`,
    title: `${original.title} (Copy)`,
    position: original.position + 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  const sections = [...outline.sections];
  sections.splice(idx + 1, 0, copy);
  const renumbered = sections.map((s, i) => ({ ...s, position: i + 1 }));
  return {
    ...outline,
    sections: renumbered,
    totalDuration: sessionBuilderService.calculateTotalDuration(renumbered)
  };
}
