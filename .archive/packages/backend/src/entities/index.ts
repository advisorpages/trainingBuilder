// Core entities
export { Role } from './role.entity';
export { User } from './user.entity';
export { SystemSetting, SettingDataType } from './system-setting.entity';

// Resource entities (brownfield)
export { Location } from './location.entity';
export { Trainer } from './trainer.entity';
export { Topic } from './topic.entity';

// Attribute entities
export { Audience } from './audience.entity';
export { Tone } from './tone.entity';
export { Category } from './category.entity';

// Feature entities
export { Session, SessionStatus } from './session.entity';
export { SessionStatusHistory } from './session-status-history.entity';
export { Incentive, IncentiveStatus } from './incentive.entity';
export { Registration, SyncStatus } from './registration.entity';
export { CoachingTip, DifficultyLevel } from './coaching-tip.entity';
export { SessionCoachingTip, SessionCoachingTipStatus } from './session-coaching-tip.entity';

// Entity array for TypeORM configuration
import { Role } from './role.entity';
import { User } from './user.entity';
import { Location } from './location.entity';
import { Trainer } from './trainer.entity';
import { Topic } from './topic.entity';
import { Audience } from './audience.entity';
import { Tone } from './tone.entity';
import { Category } from './category.entity';
import { Session } from './session.entity';
import { SessionStatusHistory } from './session-status-history.entity';
import { Incentive } from './incentive.entity';
import { Registration } from './registration.entity';
import { CoachingTip } from './coaching-tip.entity';
import { SessionCoachingTip } from './session-coaching-tip.entity';
import { SystemSetting } from './system-setting.entity';

export const entities = [
  Role,
  User,
  SystemSetting,
  Location,
  Trainer,
  Topic,
  Audience,
  Tone,
  Category,
  Session,
  SessionStatusHistory,
  Incentive,
  Registration,
  CoachingTip,
  SessionCoachingTip,
];