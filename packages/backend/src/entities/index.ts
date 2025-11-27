import { Session } from './session.entity';
import { SessionAgendaItem } from './session-agenda-item.entity';
import { SessionContentVersion } from './session-content-version.entity';
import { SessionStatusLog } from './session-status-log.entity';
import { SessionBuilderDraft } from './session-builder-draft.entity';
import { SessionTopic } from './session-topic.entity';
import { SessionTopicTrainer } from './session-topic-trainer.entity';
import { Topic } from './topic.entity';
import { Incentive } from './incentive.entity';
import { LandingPage } from './landing-page.entity';
import { Trainer } from './trainer.entity';
import { TrainerAssignment } from './trainer-assignment.entity';
import { TrainerAsset } from './trainer-asset.entity';
import { User } from './user.entity';
import { Prompt } from './prompt.entity';
import { Category } from './category.entity';
import { Location } from './location.entity';
import { Audience } from './audience.entity';
import { Tone } from './tone.entity';
import { AIInteraction } from './ai-interaction.entity';
import { RagSettings } from './rag-settings.entity';
import { AiPromptSetting } from './ai-prompt-setting.entity';
import { VariantCache } from './variant-cache.entity';
import { SavedVariant } from './saved-variant.entity';
import { PersonalizedName } from './personalized-name.entity';

export * from './base.entity';
export * from './session.entity';
export * from './session-agenda-item.entity';
export * from './session-content-version.entity';
export * from './session-status-log.entity';
export * from './session-builder-draft.entity';
export * from './session-topic.entity';
export * from './session-topic-trainer.entity';
export * from './topic.entity';
export * from './incentive.entity';
export * from './landing-page.entity';
export * from './trainer.entity';
export * from './trainer-assignment.entity';
export * from './trainer-asset.entity';
export * from './user.entity';
export * from './prompt.entity';
export * from './category.entity';
export * from './location.entity';
export * from './audience.entity';
export * from './tone.entity';
export * from './ai-interaction.entity';
export * from './rag-settings.entity';
export * from './ai-prompt-setting.entity';
export * from './variant-cache.entity';
export * from './saved-variant.entity';
export * from './personalized-name.entity';

export const entities = [
  Session,
  SessionAgendaItem,
  SessionContentVersion,
  SessionStatusLog,
  SessionBuilderDraft,
  SessionTopic,
  SessionTopicTrainer,
  Topic,
  Incentive,
  LandingPage,
  Trainer,
  TrainerAssignment,
  TrainerAsset,
  User,
  Prompt,
  Category,
  Location,
  Audience,
  Tone,
  AIInteraction,
  RagSettings,
  AiPromptSetting,
  VariantCache,
  SavedVariant,
  PersonalizedName,
];
