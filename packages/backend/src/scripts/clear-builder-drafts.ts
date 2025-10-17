import { DataSource } from 'typeorm';
import { entities } from '../entities';

async function clearBuilderDrafts() {
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
    console.log('🧹 Clearing old builder drafts...');

    // Get count before clearing
    const result = await dataSource.query(
      'SELECT COUNT(*) as count FROM session_builder_drafts'
    );
    const count = parseInt(result[0]?.count) || 0;
    console.log(`📊 Found ${count} draft records to clear`);

    if (count === 0) {
      console.log('✅ No builder drafts found - already clean!');
      return;
    }

    // Clear the table
    await dataSource.query('TRUNCATE TABLE session_builder_drafts CASCADE');

    console.log('✅ Successfully cleared all builder drafts');
    console.log(`🗑️  Removed ${count} draft records`);
    console.log('📦 Database cleanup complete - new drafts will be more efficient');
    console.log('🚀 Ready for streamlined session building experience');

  } catch (error) {
    console.error('❌ Error clearing builder drafts:', error);
    console.log('💡 You can safely continue - this was just cleanup, not required');
    process.exit(1);
  } finally {
    await dataSource.destroy();
  }
}

clearBuilderDrafts().catch((error) => {
  console.error('❌ Script failed:', error);
  process.exit(1);
});