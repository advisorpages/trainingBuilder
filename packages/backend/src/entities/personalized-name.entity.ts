import { Column, Entity, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from './base.entity';
import { User } from './user.entity';

export enum PersonalizedNameType {
  HUSBAND = 'husband',
  WIFE = 'wife',
  PARTNER = 'partner',
  CHILD = 'child',
  PARENT = 'parent',
  SIBLING = 'sibling',
  FRIEND = 'friend',
  COLLEAGUE = 'colleague',
  OTHER = 'other'
}

// Re-export for DTOs
export { PersonalizedNameType as PersonalizedNameTypeEnum };

@Entity({ name: 'personalized_names' })
export class PersonalizedName extends BaseEntity {
  @Column({ name: 'user_id' })
  userId: string;

  @Column({
    type: 'enum',
    enum: PersonalizedNameType,
    enumName: 'personalized_name_type_enum'
  })
  type: PersonalizedNameType;

  @Column({ name: 'custom_label', nullable: true })
  customLabel?: string;

  @Column({ length: 100 })
  name: string;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;
}