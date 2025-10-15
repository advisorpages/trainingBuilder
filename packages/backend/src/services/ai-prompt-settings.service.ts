import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AiPromptSetting } from '../entities/ai-prompt-setting.entity';

export interface PromptVariantPersona {
  id: string;
  label: string;
  summary?: string;
  prompt: string;
}

export interface PromptSandboxSettings {
  version: string;
  variantPersonas: PromptVariantPersona[];
  globalTone: {
    toneGuidelines: string;
    systemGuidelines: string;
  };
  durationFlow: {
    pacingGuidelines: string;
    structuralNotes: string;
  };
  quickTweaks: {
    increaseDataEmphasis: boolean;
    speedUpPace: boolean;
    raiseRagPriority: boolean;
  };
}

export interface CurrentPromptSettingsResponse {
  setting: AiPromptSetting;
  settings: PromptSandboxSettings;
}

export interface UpdateCurrentPromptSettingsDto {
  settings?: PromptSandboxSettings;
  label?: string;
  notes?: string;
  actor?: string;
  sourceOverrideId?: string;
}

export interface CreatePromptOverrideDto {
  label: string;
  description?: string;
  notes?: string;
  actor?: string;
  settings: PromptSandboxSettings;
}

@Injectable()
export class AiPromptSettingsService {
  private readonly category = 'session_ai_tuner';

  constructor(
    @InjectRepository(AiPromptSetting)
    private readonly promptSettingsRepository: Repository<AiPromptSetting>
  ) {}

  async getCurrentSettings(): Promise<CurrentPromptSettingsResponse> {
    let current = await this.promptSettingsRepository.findOne({
      where: { category: this.category, isCurrent: true },
      order: { updatedAt: 'DESC' },
    });

    if (!current) {
      current = await this.createDefaultCurrentSetting();
    }

    // Ensure all default personas are present and in correct order
    const settings = (current.settings ?? {}) as PromptSandboxSettings;
    const defaultSettings = this.buildDefaultSettings();

    // If personas don't match exactly (different count or content), reset to defaults
    if (!settings.variantPersonas ||
        settings.variantPersonas.length !== defaultSettings.variantPersonas.length ||
        !this.arePersonasMatch(settings.variantPersonas, defaultSettings.variantPersonas)) {

      settings.variantPersonas = [...defaultSettings.variantPersonas];

      // Update the database record
      current.settings = settings;
      current = await this.promptSettingsRepository.save(current);
    }

    return {
      setting: current,
      settings: settings,
    };
  }

  async updateCurrentSettings(dto: UpdateCurrentPromptSettingsDto): Promise<CurrentPromptSettingsResponse> {
    if (dto.sourceOverrideId) {
      return this.setCurrentFromOverride(dto.sourceOverrideId, dto.actor);
    }

    const current = await this.getCurrentSettingEntity();

    if (dto.settings) {
      this.validateSettings(dto.settings);
      current.settings = dto.settings;
    }

    if (dto.label) {
      current.label = dto.label;
      current.slug = await this.generateUniqueSlug(dto.label, current.id);
    }

    if (dto.notes !== undefined) {
      current.notes = dto.notes;
    }

    if (dto.actor) {
      current.createdBy = dto.actor;
    }

    const saved = await this.promptSettingsRepository.save(current);
    return {
      setting: saved,
      settings: saved.settings as PromptSandboxSettings,
    };
  }

  async listOverrides(): Promise<AiPromptSetting[]> {
    return this.promptSettingsRepository.find({
      where: { category: this.category, isPinned: true, isArchived: false },
      order: { updatedAt: 'DESC' },
    });
  }

  async createOverride(dto: CreatePromptOverrideDto): Promise<AiPromptSetting> {
    this.validateSettings(dto.settings);

    const slug = await this.generateUniqueSlug(dto.label);

    const override = this.promptSettingsRepository.create({
      category: this.category,
      label: dto.label,
      slug,
      description: dto.description,
      notes: dto.notes,
      settings: dto.settings,
      isPinned: true,
      isCurrent: false,
      isArchived: false,
      createdBy: dto.actor,
    });

    return this.promptSettingsRepository.save(override);
  }

  async deleteOverride(id: string): Promise<void> {
    const override = await this.promptSettingsRepository.findOne({ where: { id } });
    if (!override) {
      throw new NotFoundException(`Prompt override ${id} not found`);
    }

    if (override.isCurrent) {
      throw new BadRequestException('Cannot delete the active prompt settings');
    }

    await this.promptSettingsRepository.delete(id);
  }

  async setCurrentFromOverride(id: string, actor?: string): Promise<CurrentPromptSettingsResponse> {
    const override = await this.promptSettingsRepository.findOne({ where: { id } });
    if (!override) {
      throw new NotFoundException(`Prompt override ${id} not found`);
    }

    if (override.isArchived) {
      throw new BadRequestException('Cannot activate an archived prompt override');
    }

    const current = await this.getCurrentSettingEntity();
    current.isCurrent = false;
    await this.promptSettingsRepository.save(current);

    override.isCurrent = true;
    override.isPinned = false; // once active, treat as baseline
    override.createdBy = actor ?? override.createdBy;
    await this.promptSettingsRepository.save(override);

    return {
      setting: override,
      settings: override.settings as PromptSandboxSettings,
    };
  }

  private async getCurrentSettingEntity(): Promise<AiPromptSetting> {
    const current = await this.promptSettingsRepository.findOne({
      where: { category: this.category, isCurrent: true },
      order: { updatedAt: 'DESC' },
    });

    if (!current) {
      return this.createDefaultCurrentSetting();
    }

    return current;
  }

  private async createDefaultCurrentSetting(): Promise<AiPromptSetting> {
    const defaults = this.buildDefaultSettings();
    const defaultSlug = await this.generateUniqueSlug('Session Builder Default');

    const setting = this.promptSettingsRepository.create({
      category: this.category,
      label: 'Session Builder Default',
      slug: defaultSlug,
      description: 'Baseline configuration for the Session AI Tuner prompt sandbox',
      settings: defaults,
      isCurrent: true,
      isPinned: false,
      isArchived: false,
      createdBy: 'system',
      notes: 'Auto-generated default settings',
    });

    return this.promptSettingsRepository.save(setting);
  }

  private buildDefaultSettings(): PromptSandboxSettings {
    return {
      version: '1.0.0',
      variantPersonas: [
        {
          id: 'precision',
          label: 'Precision Persona',
          summary: 'Lean on data-backed framing with crisp, high-confidence delivery.',
          prompt:
            'Lead with measurable outcomes, cite relevant metrics when available, and tighten language to reduce filler. Maintain a confident, expert tone that anticipates stakeholder scrutiny.',
        },
        {
          id: 'insight',
          label: 'Insight Persona',
          summary: 'Emphasize evidence-based approaches with data, research, and proven strategies.',
          prompt:
            'Build logic-driven content emphasizing facts, statistics, case studies, and measurable outcomes. Include analysis activities, research findings, and evidence-based practices. Present insights with statistics and proof points.',
        },
        {
          id: 'ignite',
          label: 'Ignite Persona',
          summary: 'Fast-paced, results-oriented approach with immediate takeaways and momentum.',
          prompt:
            'Design high-energy content focused on quick wins and immediate action. Use rapid-fire activities, time-boxed exercises, and goal-oriented challenges. Keep content concise and focus on "what to do now" with urgency.',
        },
        {
          id: 'connect',
          label: 'Connect Persona',
          summary: 'Story-driven, collaborative approach building rapport and real-world connection.',
          prompt:
            'Create people-centered content using stories, real-world scenarios, and collaborative activities. Use storytelling, empathy, and authentic connection. Encourage peer discussions, group sharing, and relationship-building exercises.',
        },
      ],
      globalTone: {
        toneGuidelines:
          'Use modern, encouraging language that feels collaborative and professional. Favor concise sentences with strong verbs. Avoid jargon unless it is already part of the session metadata. Embed empathy when addressing current challenges, and always return to actionable next steps.',
        systemGuidelines:
          'You are SessionBuilder, an orchestration system that composes training outlines, prompts, and configuration snippets. Always produce JSON-valid payloads when asked. Preserve section ordering, maintain consistency of durations, and respect any override directives that are supplied by the operator.',
      },
      durationFlow: {
        pacingGuidelines:
          'Anchor total runtime to the provided duration target. Keep openings between 8–12% of the agenda, learning blocks between 45–55%, and application/commitment segments between 20–25%. Ensure at least one short reflection moment when duration exceeds 60 minutes.',
        structuralNotes:
          'Sequence sections to move from context → concept → application → reflection. Flag natural breakpoints every 45 minutes. When RAG sources are available, cite where they influence activities or talking points. Close with concrete commitments and recap the most practical tools introduced.',
      },
      quickTweaks: {
        increaseDataEmphasis: false,
        speedUpPace: false,
        raiseRagPriority: true,
      },
    };
  }

  private validateSettings(settings: PromptSandboxSettings): void {
    if (!settings.variantPersonas?.length) {
      throw new BadRequestException('At least one variant persona is required.');
    }

    for (const persona of settings.variantPersonas) {
      if (!persona.id || !persona.label || !persona.prompt) {
        throw new BadRequestException('Variant personas must include id, label, and prompt.');
      }
    }

    if (!settings.globalTone?.toneGuidelines || !settings.globalTone?.systemGuidelines) {
      throw new BadRequestException('Global tone must include toneGuidelines and systemGuidelines.');
    }

    if (!settings.durationFlow?.pacingGuidelines || !settings.durationFlow?.structuralNotes) {
      throw new BadRequestException('Duration & flow must include pacingGuidelines and structuralNotes.');
    }
  }

  private arePersonasMatch(current: PromptVariantPersona[], expected: PromptVariantPersona[]): boolean {
    if (current.length !== expected.length) return false;

    const currentIds = current.map(p => p.id).sort();
    const expectedIds = expected.map(p => p.id).sort();

    return JSON.stringify(currentIds) === JSON.stringify(expectedIds);
  }

  private async generateUniqueSlug(label: string, excludeId?: string): Promise<string> {
    const base = label
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 50);

    let candidate = base || `settings-${Date.now()}`;
    let suffix = 1;

    while (suffix <= 100) {
      const existing = await this.promptSettingsRepository.findOne({
        where: { slug: candidate },
      });

      if (!existing || existing.id === excludeId) {
        return candidate;
      }

      suffix += 1;
      candidate = `${base}-${suffix}`;
    }
  }
}
