#!/usr/bin/env ts-node

import { Topic } from '../entities/topic.entity';
import { TestDataFactory } from '../test/test-data.factory';
import AppDataSource from '../config/typeorm.config';

/**
 * Standalone script to seed business training topics
 *
 * Usage:
 *   npm run seed:topics
 *   or
 *   docker-compose exec backend npm run seed:topics
 */

async function seedTopics() {
  try {
    // Initialize database connection using existing configuration
    await AppDataSource.initialize();
    console.log('📦 Database connection established');

    // Get topic repository
    const topicRepo = AppDataSource.getRepository(Topic);

    // Check existing topics
    const existingTopics = await topicRepo.find();
    console.log(`📊 Found ${existingTopics.length} existing topics`);

    if (existingTopics.length > 0) {
      console.log('📝 Topics already exist:');
      existingTopics.forEach((topic, index) => {
        console.log(`  ${index + 1}. ${topic.name}`);
      });

      console.log('\n❓ Do you want to continue and add more topics? [y/N]');
      // In a real implementation, you might want to add interactive confirmation
      // For now, we'll proceed if FORCE_SEED is set
      if (!process.env.FORCE_SEED) {
        console.log('🚫 Skipping topic seeding. Use FORCE_SEED=true to override.');
        return;
      }
    }

    // Create comprehensive business training topics
    console.log('🌱 Creating business training topics...');
    const businessTopics = TestDataFactory.createBusinessTopics();

    // Convert to Topic entities and save
    const topicEntities = businessTopics.map((topicData) => {
      const topic = new Topic();
      topic.name = topicData.name;
      topic.description = topicData.description;
      topic.learningOutcomes = topicData.learningOutcomes;
      topic.trainerNotes = topicData.trainerNotes;
      topic.materialsNeeded = topicData.materialsNeeded;
      topic.deliveryGuidance = topicData.deliveryGuidance;
      topic.isActive = topicData.isActive ?? true;
      return topic;
    });

    const savedTopics = await topicRepo.save(topicEntities);

    console.log(`✅ Successfully created ${savedTopics.length} topics:`);

    // Display all created topics grouped by category
    const leadershipTopics = ['Strategic Leadership', 'Team Building & Dynamics', 'Performance Management', 'Change Management', 'Conflict Resolution', 'Emotional Intelligence'];
    const salesTopics = ['Consultative Selling', 'Prospecting & Lead Generation', 'Negotiation Skills', 'Customer Relationship Management', 'Presentation Skills'];
    const professionalTopics = ['Time Management & Productivity', 'Communication Skills', 'Problem Solving & Decision Making', 'Professional Networking'];

    const categories = {
      'Leadership & Management': savedTopics.filter(t => leadershipTopics.includes(t.name)),
      'Sales & Business Development': savedTopics.filter(t => salesTopics.includes(t.name)),
      'Professional Development': savedTopics.filter(t => professionalTopics.includes(t.name)),
    };

    Object.entries(categories).forEach(([category, topics]) => {
      if (topics.length > 0) {
        console.log(`\n📚 ${category}:`);
        topics.forEach(topic => {
          console.log(`  • ${topic.name}`);
          console.log(`    ${topic.description}\n`);
        });
      }
    });

    console.log('🎉 Topic seeding completed successfully!');
    console.log(`\n🔗 View topics at: http://localhost:3002/topics`);

  } catch (error) {
    console.error('❌ Failed to seed topics:', error);
    process.exit(1);
  } finally {
    if (AppDataSource?.isInitialized) {
      await AppDataSource.destroy();
      console.log('📦 Database connection closed');
    }
  }
}

// Run the seeder
if (require.main === module) {
  seedTopics();
}

export { seedTopics };
