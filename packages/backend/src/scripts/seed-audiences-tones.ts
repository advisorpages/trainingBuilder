import 'reflect-metadata';
import { DataSource, In } from 'typeorm';
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

    // Sample Tones aligned with conversational persona strategy
    const tones = [
      {
        name: 'Friendly Coach',
        description: 'Supportive mentor voice that blends warmth with practical direction',
        style: ToneStyle.EMPOWERING,
        formality: 2,
        energyLevel: ToneEnergyLevel.MODERATE,
        languageCharacteristics: ['encouraging', 'clear', 'supportive', 'action-oriented'],
        sentenceStructure: ToneSentenceStructure.VARIED,
        emotionalResonance: ['trust', 'optimism', 'confidence'],
        examplePhrases: [
          'Let\'s tackle this together—here\'s the first small step.',
          'You already have the instincts; we\'ll sharpen them with practice.',
          'Try this playbook and see how it lands with your next group.',
        ],
        promptInstructions: 'Sound like a trusted coach. Use second-person language, share quick wins, and keep tips practical without leaning on corporate buzzwords. Keep exclamation marks to singles.',
      },
      {
        name: 'Casual Colleague',
        description: 'Down-to-earth teammate who keeps things real and relatable',
        style: ToneStyle.CASUAL,
        formality: 2,
        energyLevel: ToneEnergyLevel.MODERATE,
        languageCharacteristics: ['conversational', 'straightforward', 'relatable', 'light-humor'],
        sentenceStructure: ToneSentenceStructure.SIMPLE,
        emotionalResonance: ['camaraderie', 'ease', 'clarity'],
        examplePhrases: [
          'Here\'s how I handle it when a session starts to drift.',
          'You know that moment when everyone goes quiet? Try this reset.',
          'Let\'s make this easier than the usual slide dump.',
        ],
        promptInstructions: 'Write like you are chatting with a coworker over coffee. Use contractions, short paragraphs, and the occasional rhetorical question. Avoid jargon and stiff phrasing.',
      },
      {
        name: 'Energetic Friend',
        description: 'Upbeat motivator who keeps energy high without sounding salesy',
        style: ToneStyle.MOTIVATIONAL,
        formality: 1,
        energyLevel: ToneEnergyLevel.ENERGETIC,
        languageCharacteristics: ['upbeat', 'motivating', 'positive', 'direct'],
        sentenceStructure: ToneSentenceStructure.VARIED,
        emotionalResonance: ['excitement', 'encouragement', 'momentum'],
        examplePhrases: [
          'You can light up the room with this opener—give it a shot!',
          'Keep the pace snappy and celebrate every small win.',
          'This is where the session clicks for people—lean into it.',
        ],
        promptInstructions: 'Bring contagious energy with short, punchy sentences and positive reinforcement. Invite the reader to act. Limit exclamation marks to one at a time and steer clear of hype-y promises.',
      },
      {
        name: 'Storytelling Buddy',
        description: 'Narrative guide who connects ideas to real-world moments',
        style: ToneStyle.COLLABORATIVE,
        formality: 2,
        energyLevel: ToneEnergyLevel.MODERATE,
        languageCharacteristics: ['narrative', 'descriptive', 'empathetic', 'grounded'],
        sentenceStructure: ToneSentenceStructure.VARIED,
        emotionalResonance: ['connection', 'curiosity', 'empathy'],
        examplePhrases: [
          'Picture the session when someone finally shares that honest story.',
          'Here’s a moment that still sticks with me—and why it worked.',
          'Tee up each activity with a quick story that invites people in.',
        ],
        promptInstructions: 'Use story-driven framing, sensory detail, and smooth transitions. Share quick anecdotes or starter phrases, then tie them back to clear takeaways. Keep it conversational, not overly dramatic.',
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

    // Deactivate legacy tones that conflict with the new persona strategy
    const retiredToneNames = [
      'Professional & Polished',
      'Conversational & Friendly',
      'Motivational & Inspiring',
      'Technical & Precise',
      'Collaborative & Inclusive',
      'Directive & Action-Focused',
    ];

    await toneRepository.update(
      { name: In(retiredToneNames) },
      { isActive: false },
    );

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
