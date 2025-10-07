import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { entities } from '../entities';
import {
  Audience,
  AudienceExperienceLevel,
  AudienceCommunicationStyle,
  AudienceVocabularyLevel
} from '../entities/audience.entity';
import {
  Tone,
  ToneStyle,
  ToneEnergyLevel,
  ToneSentenceStructure
} from '../entities/tone.entity';

async function runSeeder() {
  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DATABASE_HOST || 'localhost',
    port: parseInt(process.env.DATABASE_PORT || '5432', 10),
    username: process.env.DATABASE_USER || 'postgres',
    password: process.env.DATABASE_PASSWORD || 'postgres',
    database: process.env.DATABASE_NAME || 'leadership_training',
    entities,
    synchronize: false,
  });

  await dataSource.initialize();

  try {
    console.log('🌱 Seeding audiences and tones...');

    const audienceRepository = dataSource.getRepository(Audience);
    const toneRepository = dataSource.getRepository(Tone);

    // Audiences focused on financial services and team building
    const audiences = [
      {
        name: 'Prospects',
        description: 'Individuals exploring opportunities to improve their financial situation and learn about potential income opportunities',
        experienceLevel: AudienceExperienceLevel.BEGINNER,
        technicalDepth: 1,
        preferredLearningStyle: 'conversational, storytelling, relatable examples, encouraging atmosphere',
        communicationStyle: AudienceCommunicationStyle.CONVERSATIONAL,
        exampleTypes: ['financial planning basics', 'debt reduction success stories', 'savings strategies', 'income opportunities', 'financial goal setting', 'life improvement through finances'],
        avoidTopics: ['overly technical financial jargon', 'high-pressure sales tactics', 'complex investment strategies'],
        vocabularyLevel: AudienceVocabularyLevel.BASIC,
        promptInstructions: 'Use an encouraging, welcoming tone. Focus on the next step they can take to improve their finances. Present team opportunity as a path to accelerate financial and life goals. Avoid pressure - emphasize possibilities and empowerment. Use relatable success stories.',
      },
      {
        name: 'Clients',
        description: 'Current clients who already use financial products and may be interested in additional services or team opportunities',
        experienceLevel: AudienceExperienceLevel.INTERMEDIATE,
        technicalDepth: 2,
        preferredLearningStyle: 'practical examples, success stories, product comparisons, interactive discussion',
        communicationStyle: AudienceCommunicationStyle.CONVERSATIONAL,
        exampleTypes: ['product diversification', 'financial growth strategies', 'wealth building techniques', 'team opportunity benefits', 'maximizing existing products', 'expanding financial protection'],
        avoidTopics: ['basic introductory concepts they already know', 'unrelated products', 'aggressive recruiting language'],
        vocabularyLevel: AudienceVocabularyLevel.PROFESSIONAL,
        promptInstructions: 'Build on existing relationship and trust. Show how additional products can help them get ahead financially. Present team opportunity as a way to accelerate their financial and life goals. Maintain encouraging tone. Focus on value and next steps without pressure.',
      },
      {
        name: 'Existing Teammates',
        description: 'Current team members working to grow their business by finding new clients and recruiting new teammates',
        experienceLevel: AudienceExperienceLevel.INTERMEDIATE,
        technicalDepth: 3,
        preferredLearningStyle: 'action-oriented, hands-on practice, role-playing, immediate application, success strategies',
        communicationStyle: AudienceCommunicationStyle.CONVERSATIONAL,
        exampleTypes: ['prospecting techniques', 'client acquisition strategies', 'recruiting best practices', 'team building approaches', 'path to RVP/Broker promotion', 'overcoming objections', 'follow-up systems', 'income growth strategies'],
        avoidTopics: ['basic product knowledge they already have', 'overly theoretical concepts', 'slow-paced strategies'],
        vocabularyLevel: AudienceVocabularyLevel.PROFESSIONAL,
        promptInstructions: 'Create urgency and inspire immediate action. Focus on two key activities: finding new clients to make money AND recruiting new teammates to build their agency. Emphasize the path to becoming an RVP/Broker. Use motivational language. Provide specific, actionable steps they can take right away. Make it feel achievable and exciting.',
      },
      {
        name: 'Brokers/RVPs',
        description: 'Regional Vice Presidents and Brokers focused on developing their team and scaling their agency',
        experienceLevel: AudienceExperienceLevel.ADVANCED,
        technicalDepth: 4,
        preferredLearningStyle: 'strategic frameworks, leadership development, scalable systems, peer discussion, case studies',
        communicationStyle: AudienceCommunicationStyle.FORMAL,
        exampleTypes: ['leadership development strategies', 'teammate promotion to Broker/RVP', 'team-level client generation', 'agency scaling techniques', 'team motivation systems', 'recruiting pipelines', 'organizational growth', 'mentorship frameworks'],
        avoidTopics: ['individual sales tactics', 'entry-level concepts', 'one-on-one client strategies'],
        vocabularyLevel: AudienceVocabularyLevel.EXPERT,
        promptInstructions: 'Focus on multiplication and leverage. Emphasize developing existing teammates to become Brokers/RVPs. Show strategies for generating clients at the team level, not just individually. Use leadership language. Present scalable, systematic approaches to growth. Speak to their role as leaders who build other leaders.',
      },
    ];

    // Sample Tones
    const tones = [
      {
        name: 'Professional & Polished',
        description: 'Formal, authoritative tone suitable for executive audiences',
        style: ToneStyle.PROFESSIONAL,
        formality: 5,
        energyLevel: ToneEnergyLevel.MODERATE,
        languageCharacteristics: ['active-voice', 'precise', 'data-driven', 'objective'],
        sentenceStructure: ToneSentenceStructure.COMPLEX,
        emotionalResonance: ['confidence', 'authority', 'clarity'],
        examplePhrases: [
          'Our analysis indicates that strategic alignment will drive measurable outcomes.',
          'The data supports a phased implementation approach.',
          'This framework has been validated across multiple industries.',
        ],
        promptInstructions: 'Maintain professional distance. Use industry-standard terminology. Support assertions with evidence. Avoid colloquialisms.',
      },
      {
        name: 'Conversational & Friendly',
        description: 'Warm, approachable tone that builds connection',
        style: ToneStyle.CASUAL,
        formality: 2,
        energyLevel: ToneEnergyLevel.MODERATE,
        languageCharacteristics: ['inclusive', 'relatable', 'conversational', 'supportive'],
        sentenceStructure: ToneSentenceStructure.SIMPLE,
        emotionalResonance: ['warmth', 'empathy', 'encouragement'],
        examplePhrases: [
          'Let\'s explore how this works in real life.',
          'You might be thinking - "How does this apply to me?"',
          'Here\'s the good news: you already have what it takes.',
        ],
        promptInstructions: 'Write like you\'re talking to a colleague over coffee. Use contractions. Ask rhetorical questions. Be encouraging.',
      },
      {
        name: 'Motivational & Inspiring',
        description: 'Energetic, empowering tone that drives action',
        style: ToneStyle.MOTIVATIONAL,
        formality: 3,
        energyLevel: ToneEnergyLevel.ENERGETIC,
        languageCharacteristics: ['action-oriented', 'empowering', 'positive', 'direct'],
        sentenceStructure: ToneSentenceStructure.VARIED,
        emotionalResonance: ['inspiration', 'confidence', 'urgency', 'excitement'],
        examplePhrases: [
          'You have the power to transform your team starting today.',
          'This is your moment to step into leadership.',
          'Small actions, repeated consistently, create extraordinary results.',
        ],
        promptInstructions: 'Use powerful verbs. Create vivid imagery. Focus on possibilities. Build momentum. End with strong calls to action.',
      },
      {
        name: 'Technical & Precise',
        description: 'Clear, logical tone for technical audiences',
        style: ToneStyle.AUTHORITATIVE,
        formality: 4,
        energyLevel: ToneEnergyLevel.CALM,
        languageCharacteristics: ['precise', 'logical', 'structured', 'evidence-based'],
        sentenceStructure: ToneSentenceStructure.MODERATE,
        emotionalResonance: ['clarity', 'confidence', 'objectivity'],
        examplePhrases: [
          'The algorithm follows a three-step process: input validation, transformation, and output.',
          'Consider the following implementation pattern.',
          'This approach reduces complexity by abstracting the underlying logic.',
        ],
        promptInstructions: 'Be exact and unambiguous. Use technical terminology appropriately. Provide clear structure. Include concrete examples.',
      },
      {
        name: 'Collaborative & Inclusive',
        description: 'Team-focused tone that emphasizes shared ownership',
        style: ToneStyle.COLLABORATIVE,
        formality: 3,
        energyLevel: ToneEnergyLevel.MODERATE,
        languageCharacteristics: ['inclusive', 'we-focused', 'participatory', 'respectful'],
        sentenceStructure: ToneSentenceStructure.VARIED,
        emotionalResonance: ['belonging', 'partnership', 'mutual-respect'],
        examplePhrases: [
          'Together, we can explore different perspectives on this challenge.',
          'What insights can we draw from our collective experience?',
          'Let\'s build on each other\'s ideas to find the best path forward.',
        ],
        promptInstructions: 'Use "we" language. Invite participation. Acknowledge diverse perspectives. Create psychological safety.',
      },
      {
        name: 'Directive & Action-Focused',
        description: 'Clear, direct tone that drives immediate action',
        style: ToneStyle.DIRECTIVE,
        formality: 3,
        energyLevel: ToneEnergyLevel.ENERGETIC,
        languageCharacteristics: ['imperative', 'concise', 'action-oriented', 'clear'],
        sentenceStructure: ToneSentenceStructure.SIMPLE,
        emotionalResonance: ['urgency', 'clarity', 'confidence'],
        examplePhrases: [
          'Start by identifying your top three priorities.',
          'Take this specific action before the end of the week.',
          'Here\'s exactly what to do next.',
        ],
        promptInstructions: 'Use imperative verbs. Be specific and concrete. Provide clear next steps. Keep sentences short and punchy.',
      },
    ];

    // Save audiences
    for (const audienceData of audiences) {
      const existing = await audienceRepository.findOne({ where: { name: audienceData.name } });
      if (!existing) {
        await audienceRepository.save(audienceRepository.create(audienceData));
        console.log(`✅ Created audience: ${audienceData.name}`);
      } else {
        console.log(`⏭️  Skipped existing audience: ${audienceData.name}`);
      }
    }

    // Save tones
    for (const toneData of tones) {
      const existing = await toneRepository.findOne({ where: { name: toneData.name } });
      if (!existing) {
        await toneRepository.save(toneRepository.create(toneData));
        console.log(`✅ Created tone: ${toneData.name}`);
      } else {
        console.log(`⏭️  Skipped existing tone: ${toneData.name}`);
      }
    }

    console.log('🎉 Audience and tone seeding complete!');
  } finally {
    await dataSource.destroy();
  }
}

if (require.main === module) {
  runSeeder().catch((error) => {
    console.error('❌ Seeding failed', error);
    process.exit(1);
  });
}

export { runSeeder };
