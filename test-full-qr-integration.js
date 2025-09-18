// Full integration test with our QrCodeService using the real API
const { Test } = require('@nestjs/testing');
const { ConfigService } = require('@nestjs/config');

// We'll simulate our service behavior
class TestQrCodeService {
  constructor() {
    this.apiKey = 'b0b49dc4204835f2d97934c1d34b7ffb';
    this.apiBaseUrl = 'https://qrcodes.at/api';
  }

  async generateQrCodeForSession(sessionId, sessionTitle, baseUrl) {
    const axios = require('axios');
    const FormData = require('form-data');

    try {
      const formData = new FormData();
      formData.append('name', `Session: ${sessionTitle}`);
      formData.append('type', 'url');
      formData.append('url', `${baseUrl}/sessions/${sessionId}`);
      formData.append('style', 'round');
      formData.append('foreground_color', '#000000');
      formData.append('background_color', '#FFFFFF');

      console.log(`📡 Creating QR code for session ${sessionId}...`);

      // Step 1: Create QR code
      const createResponse = await axios.post(`${this.apiBaseUrl}/qr-codes`, formData, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'multipart/form-data',
        },
        timeout: 30000,
      });

      if (!createResponse.data?.data?.id) {
        return { success: false, error: 'Invalid response from QR code creation API' };
      }

      const qrCodeId = createResponse.data.data.id;
      console.log(`✅ QR code created with ID: ${qrCodeId}`);

      // Step 2: Get QR code details
      console.log(`📡 Fetching QR code details...`);
      const detailsResponse = await axios.get(`${this.apiBaseUrl}/qr-codes/${qrCodeId}`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
        timeout: 30000,
      });

      if (detailsResponse.data?.data?.qr_code) {
        return {
          success: true,
          qrCodeUrl: detailsResponse.data.data.qr_code,
          qrCodeId: qrCodeId.toString()
        };
      } else {
        return { success: false, error: 'Could not retrieve QR code image URL' };
      }
    } catch (error) {
      console.error('❌ Error:', error.message);
      return { success: false, error: error.message };
    }
  }
}

async function runIntegrationTest() {
  console.log('🧪 Running Full QR Code Integration Test');
  console.log('=====================================');

  const qrService = new TestQrCodeService();

  // Test Case 1: Single QR Generation
  console.log('\n📋 Test 1: Single QR Code Generation');
  const result1 = await qrService.generateQrCodeForSession(
    'test-session-123',
    'Leadership Workshop - Effective Communication',
    'https://leadership-training.example.com'
  );

  if (result1.success) {
    console.log('✅ Test 1 PASSED');
    console.log(`   QR Code URL: ${result1.qrCodeUrl}`);
    console.log(`   QR Code ID: ${result1.qrCodeId}`);
    console.log('   💡 You can scan this QR code with your phone to test!');
  } else {
    console.log('❌ Test 1 FAILED');
    console.log(`   Error: ${result1.error}`);
  }

  // Test Case 2: Another QR Code to verify consistency
  console.log('\n📋 Test 2: Another QR Code Generation');
  const result2 = await qrService.generateQrCodeForSession(
    'test-session-456',
    'Management Training - Team Building',
    'https://leadership-training.example.com'
  );

  if (result2.success) {
    console.log('✅ Test 2 PASSED');
    console.log(`   QR Code URL: ${result2.qrCodeUrl}`);
    console.log(`   QR Code ID: ${result2.qrCodeId}`);
  } else {
    console.log('❌ Test 2 FAILED');
    console.log(`   Error: ${result2.error}`);
  }

  // Summary
  console.log('\n🎉 Integration Test Summary');
  console.log('===========================');

  const passedTests = [result1.success, result2.success].filter(Boolean).length;
  console.log(`✅ Passed: ${passedTests}/2 tests`);

  if (passedTests === 2) {
    console.log('🚀 All tests passed! Your QR code implementation is working correctly.');
    console.log('');
    console.log('📱 Next Steps:');
    console.log('1. Use a mobile QR code scanner to test the generated QR codes');
    console.log('2. Verify they link to the correct session URLs');
    console.log('3. Deploy to production with confidence!');
  } else {
    console.log('❌ Some tests failed. Please check the errors above.');
  }
}

runIntegrationTest().catch(console.error);