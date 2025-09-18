async function globalTeardown() {
  console.log('🧹 Starting E2E test teardown...');

  // Clean up test data
  try {
    await fetch('http://localhost:3001/test/cleanup', {
      method: 'POST',
    });
    console.log('✅ Test data cleaned up');
  } catch (error) {
    console.warn('⚠️ Could not clean up test data:', error);
  }

  console.log('✅ E2E test teardown complete');
}

export default globalTeardown;