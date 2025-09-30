import { FullConfig } from '@playwright/test';

async function globalSetup(config: FullConfig) {
  console.log('🚀 Starting E2E test setup...');

  // Wait for the application to be ready
  const maxRetries = 30;
  let retries = 0;

  while (retries < maxRetries) {
    try {
      const response = await fetch('http://localhost:3001/health');
      if (response.ok) {
        console.log('✅ Backend health check passed');
        break;
      }
    } catch (error) {
      retries++;
      if (retries === maxRetries) {
        throw new Error('❌ Backend failed to start within timeout');
      }
      console.log(`⏳ Waiting for backend... (${retries}/${maxRetries})`);
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  // Reset test database
  try {
    await fetch('http://localhost:3001/test/reset-database', {
      method: 'POST',
    });
    console.log('✅ Test database reset');
  } catch (error) {
    console.warn('⚠️ Could not reset test database:', error);
  }

  // Seed test data
  try {
    await fetch('http://localhost:3001/test/seed-data', {
      method: 'POST',
    });
    console.log('✅ Test data seeded');
  } catch (error) {
    console.warn('⚠️ Could not seed test data:', error);
  }

  console.log('✅ E2E test setup complete');
}

export default globalSetup;