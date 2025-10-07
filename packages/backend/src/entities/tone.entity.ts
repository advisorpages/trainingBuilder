import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { Session } from './session.entity';

export enum ToneStyle {
  PROFESSIONAL = 'professional',
  CASUAL = 'casual',
  MOTIVATIONAL = 'motivational',
  AUTHORITATIVE = 'authoritative',
  EMPOWERING = 'empowering',
  COLLABORATIVE = 'collaborative',
  DIRECTIVE = 'directive',
}

export enum ToneEnergyLevel {
  CALM = 'calm',
  MODERATE = 'moderate',
  ENERGETIC = 'energetic',
  PASSIONATE = 'passionate',
}

export enum ToneSentenceStructure {
  SIMPLE = 'simple',
  MODERATE = 'moderate',
  COMPLEX = 'complex',
  VARIED = 'varied',
}

@Entity('tones')
export class Tone {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({
    type: 'enum',
    enum: ToneStyle,
    enumName: 'tone_style_enum',
    default: ToneStyle.PROFESSIONAL,
  })
  style: ToneStyle;

  @Column({ type: 'int', default: 3 })
  formality: number; // 1-5 scale: 1=very casual, 5=very formal

  @Column({
    type: 'enum',
    enum: ToneEnergyLevel,
    enumName: 'tone_energy_level_enum',
    default: ToneEnergyLevel.MODERATE,
    name: 'energy_level',
  })
  energyLevel: ToneEnergyLevel;

  @Column({ type: 'jsonb', default: [], name: 'language_characteristics' })
  languageCharacteristics: string[]; // e.g., ["active-voice", "direct", "inclusive"]

  @Column({
    type: 'enum',
    enum: ToneSentenceStructure,
    enumName: 'tone_sentence_structure_enum',
    default: ToneSentenceStructure.VARIED,
    name: 'sentence_structure',
  })
  sentenceStructure: ToneSentenceStructure;

  @Column({ type: 'jsonb', default: [], name: 'emotional_resonance' })
  emotionalResonance: string[]; // e.g., ["empathy", "confidence", "urgency"]

  @Column({ type: 'jsonb', default: [], name: 'example_phrases' })
  examplePhrases: string[]; // Sample sentences that exemplify the tone

  @Column({ type: 'text', nullable: true, name: 'prompt_instructions' })
  promptInstructions?: string; // Direct AI instructions

  @Column({ type: 'boolean', default: true, name: 'is_active' })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToMany(() => Session, session => session.tone)
  sessions?: Session[];
}
