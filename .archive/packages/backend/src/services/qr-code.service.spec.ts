import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { QrCodeService } from './qr-code.service';
import axios from 'axios';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('QrCodeService', () => {
  let service: QrCodeService;
  let configService: ConfigService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QrCodeService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string, defaultValue?: any) => {
              const config = {
                QR_CLOUD_API_URL: 'https://qrcodes.at/api',
                QR_CLOUD_API_KEY: 'test-api-key',
                QR_CODE_ERROR_CORRECTION: 'M',
                QR_CODE_SIZE: '300x300',
                QR_CODE_FORMAT: 'PNG',
              };
              return config[key] || defaultValue;
            }),
          },
        },
      ],
    }).compile();

    service = module.get<QrCodeService>(QrCodeService);
    configService = module.get<ConfigService>(ConfigService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generateQrCodeForSession', () => {
    it('should successfully generate QR code for a session', async () => {
      // Mock successful API responses - first create, then get details
      const mockCreateResponse = {
        data: {
          data: {
            id: 6941,
          },
        },
      };

      const mockDetailsResponse = {
        data: {
          data: {
            id: 6941,
            name: 'Session: Test Session',
            type: 'url',
            qr_code: 'https://qrcodes.at/uploads/qr_code/test123.svg',
            settings: {
              url: 'https://example.com/sessions/session123',
            },
            datetime: '2025-09-17T13:00:00Z',
          },
        },
      };

      mockedAxios.post.mockResolvedValueOnce(mockCreateResponse);
      mockedAxios.get.mockResolvedValueOnce(mockDetailsResponse);

      const result = await service.generateQrCodeForSession(
        'session123',
        'Test Session',
        'https://example.com'
      );

      expect(result.success).toBe(true);
      expect(result.qrCodeUrl).toBe('https://qrcodes.at/uploads/qr_code/test123.svg');
      expect(result.qrCodeId).toBe('6941');
      expect(result.error).toBeUndefined();

      // Verify API calls - should be called twice (create + get details)
      expect(mockedAxios.post).toHaveBeenCalledWith(
        'https://qrcodes.at/api/qr-codes',
        expect.any(FormData),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': 'Bearer test-api-key',
            'Content-Type': 'multipart/form-data',
          }),
          timeout: 30000,
        })
      );

      expect(mockedAxios.get).toHaveBeenCalledWith(
        'https://qrcodes.at/api/qr-codes/6941',
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': 'Bearer test-api-key',
          }),
          timeout: 30000,
        })
      );
    });

    it('should handle API errors gracefully', async () => {
      // Mock API error
      mockedAxios.post.mockRejectedValueOnce(new Error('API Error'));

      const result = await service.generateQrCodeForSession(
        'session123',
        'Test Session',
        'https://example.com'
      );

      expect(result.success).toBe(false);
      expect(result.qrCodeUrl).toBeUndefined();
      expect(result.error).toBe('API Error');
    });

    it('should handle missing API key', async () => {
      // Create service without API key
      const moduleWithoutKey = await Test.createTestingModule({
        providers: [
          QrCodeService,
          {
            provide: ConfigService,
            useValue: {
              get: jest.fn((key: string, defaultValue?: any) => {
                const config = {
                  QR_CLOUD_API_URL: 'https://qrcodes.at/api',
                  QR_CLOUD_API_KEY: undefined, // No API key
                  QR_CODE_ERROR_CORRECTION: 'M',
                  QR_CODE_SIZE: '300x300',
                  QR_CODE_FORMAT: 'PNG',
                };
                return config[key] || defaultValue;
              }),
            },
          },
        ],
      }).compile();

      const serviceWithoutKey = moduleWithoutKey.get<QrCodeService>(QrCodeService);

      const result = await serviceWithoutKey.generateQrCodeForSession(
        'session123',
        'Test Session',
        'https://example.com'
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('QR code API not configured');
      expect(mockedAxios.post).not.toHaveBeenCalled();
    });
  });

  describe('batchGenerateQrCodes', () => {
    it('should generate QR codes for multiple sessions', async () => {
      // Mock successful API responses for both sessions
      const mockCreateResponse1 = { data: { data: { id: 6941 } } };
      const mockDetailsResponse1 = { data: { data: { id: 6941, qr_code: 'https://qrcodes.at/uploads/qr_code/test123.svg' } } };
      const mockCreateResponse2 = { data: { data: { id: 6942 } } };
      const mockDetailsResponse2 = { data: { data: { id: 6942, qr_code: 'https://qrcodes.at/uploads/qr_code/test456.svg' } } };

      mockedAxios.post
        .mockResolvedValueOnce(mockCreateResponse1)
        .mockResolvedValueOnce(mockCreateResponse2);

      mockedAxios.get
        .mockResolvedValueOnce(mockDetailsResponse1)
        .mockResolvedValueOnce(mockDetailsResponse2);

      const sessions = [
        { id: 'session1', title: 'Session 1' },
        { id: 'session2', title: 'Session 2' },
      ];

      const results = await service.batchGenerateQrCodes(sessions, 'https://example.com');

      expect(results).toHaveLength(2);
      expect(results[0].sessionId).toBe('session1');
      expect(results[0].result.success).toBe(true);
      expect(results[1].sessionId).toBe('session2');
      expect(results[1].result.success).toBe(true);

      expect(mockedAxios.post).toHaveBeenCalledTimes(2);
      expect(mockedAxios.get).toHaveBeenCalledTimes(2);
    });
  });

  describe('regenerateQrCodeForSession', () => {
    it('should regenerate QR code for an existing session', async () => {
      const mockCreateResponse = { data: { data: { id: 6943 } } };
      const mockDetailsResponse = { data: { data: { id: 6943, qr_code: 'https://qrcodes.at/uploads/qr_code/test789.svg' } } };

      mockedAxios.post.mockResolvedValueOnce(mockCreateResponse);
      mockedAxios.get.mockResolvedValueOnce(mockDetailsResponse);

      const result = await service.regenerateQrCodeForSession(
        'session123',
        'Test Session',
        'https://example.com',
        'old-qr-url'
      );

      expect(result.success).toBe(true);
      expect(result.qrCodeUrl).toBe('https://qrcodes.at/uploads/qr_code/test789.svg');
    });
  });
});