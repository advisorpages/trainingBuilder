// Quick test of QR Code API with real key
const axios = require('axios');
const FormData = require('form-data');

const API_KEY = 'b0b49dc4204835f2d97934c1d34b7ffb';
const API_URL = 'https://qrcodes.at/api';

async function testQRCodeGeneration() {
  console.log('🧪 Testing QR Code Generation with real API...');

  try {
    const formData = new FormData();
    formData.append('name', 'Test Session - Leadership Training');
    formData.append('type', 'url');
    formData.append('url', 'https://example.com/sessions/test-123');
    formData.append('style', 'round');
    formData.append('foreground_color', '#000000');
    formData.append('background_color', '#FFFFFF');

    console.log('📡 Making API request to qrcodes.at...');

    const response = await axios.post(`${API_URL}/qr-codes`, formData, {
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'multipart/form-data',
      },
      timeout: 30000,
    });

    console.log('✅ QR Code generated successfully!');
    console.log('📊 Full Response:');
    console.log(JSON.stringify(response.data, null, 2));

    const qrCodeId = response.data.data.id;
    console.log(`📝 Generated QR Code ID: ${qrCodeId}`);

    // Try to get the QR code details
    console.log('📡 Fetching QR code details...');
    const detailsResponse = await axios.get(`${API_URL}/qr-codes/${qrCodeId}`, {
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
      },
    });

    console.log('📊 QR Code Details:');
    console.log(JSON.stringify(detailsResponse.data, null, 2));

    console.log('');
    console.log('🎉 API test completed!');

  } catch (error) {
    console.error('❌ QR Code generation failed:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    } else {
      console.error('Error:', error.message);
    }
  }
}

testQRCodeGeneration();