import { Column, Entity, ManyToOne } from 'typeorm';
import { BaseEntity } from './base.entity';
import { TrainerAssignment } from './trainer-assignment.entity';

export enum TrainerAssetType {
  PREP_KIT = 'prep_kit',
  COACHING_TIP = 'coaching_tip',
  ATTACHMENT = 'attachment',
}

export enum TrainerAssetSource {
  AI = 'ai',
  MANUAL = 'manual',
}

@Entity({ name: 'trainer_assets' })
export class TrainerAsset extends BaseEntity {
  @ManyToOne(() => TrainerAssignment, (assignment) => assignment.assets, {
    onDelete: 'CASCADE',
  })
  assignment: TrainerAssignment;

  @Column({ type: 'enum', enum: TrainerAssetType, enumName: 'trainer_asset_type_enum' })
  type: TrainerAssetType;

  @Column({ type: 'enum', enum: TrainerAssetSource, enumName: 'trainer_asset_source_enum' })
  source: TrainerAssetSource;

  @Column({ type: 'jsonb' })
  content: Record<string, unknown>;
}
