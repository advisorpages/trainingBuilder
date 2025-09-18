import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';
import { HttpException, HttpStatus } from '@nestjs/common';
import { QrAdminController } from './qr-admin.controller';
import { QrCodeService } from '../../services/qr-code.service';
import { Session, SessionStatus } from '../../entities/session.entity';

describe('QrAdminController', () => {
  let controller: QrAdminController;
  let sessionRepository: jest.Mocked<Repository<Session>>;
  let qrCodeService: jest.Mocked<QrCodeService>;

  beforeEach(async () => {
    const mockRepository = {
      find: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
    };

    const mockQrCodeService = {
      generateQrCodeForSession: jest.fn(),
      regenerateQrCodeForSession: jest.fn(),
      batchGenerateQrCodes: jest.fn(),
    };

    const mockConfigService = {
      get: jest.fn().mockReturnValue('http://localhost:3001/api'),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [QrAdminController],
      providers: [
        {
          provide: getRepositoryToken(Session),
          useValue: mockRepository,
        },
        {
          provide: QrCodeService,
          useValue: mockQrCodeService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    controller = module.get<QrAdminController>(QrAdminController);
    sessionRepository = module.get(getRepositoryToken(Session));
    qrCodeService = module.get(QrCodeService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getQrCodeStatus', () => {
    it('should return QR code status for published sessions', async () => {
      const mockSessions = [
        {
          id: '1',
          title: 'Test Session 1',
          status: SessionStatus.PUBLISHED,
          qrCodeUrl: 'https://qr.com/1.png',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: '2',
          title: 'Test Session 2',
          status: SessionStatus.PUBLISHED,
          qrCodeUrl: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      sessionRepository.find.mockResolvedValue(mockSessions as Session[]);

      const result = await controller.getQrCodeStatus();

      expect(result.sessions).toHaveLength(2);
      expect(result.sessions[0].has_qr_code).toBe(true);
      expect(result.sessions[1].has_qr_code).toBe(false);
      expect(sessionRepository.find).toHaveBeenCalledWith({
        where: {
          status: SessionStatus.PUBLISHED,
          isActive: true,
        },
        order: { createdAt: 'DESC' },
      });
    });
  });

  describe('generateQrCode', () => {
    it('should generate QR code for existing session', async () => {
      const mockSession = {
        id: 'session123',
        title: 'Test Session',
      };

      const mockQrResult = {
        success: true,
        qrCodeUrl: 'https://qr.com/new.png',
        qrCodeId: 'qr123',
      };

      sessionRepository.findOne.mockResolvedValue(mockSession as Session);
      qrCodeService.generateQrCodeForSession.mockResolvedValue(mockQrResult);
      sessionRepository.update.mockResolvedValue({} as any);

      const result = await controller.generateQrCode('session123');

      expect(result.success).toBe(true);
      expect(result.qr_code_url).toBe('https://qr.com/new.png');
      expect(sessionRepository.update).toHaveBeenCalledWith('session123', {
        qrCodeUrl: 'https://qr.com/new.png',
      });
    });

    it('should throw 404 for non-existent session', async () => {
      sessionRepository.findOne.mockResolvedValue(null);

      await expect(controller.generateQrCode('invalid-id')).rejects.toThrow(
        new HttpException('Session with ID invalid-id not found', HttpStatus.NOT_FOUND)
      );
    });

    it('should return error when QR generation fails', async () => {
      const mockSession = {
        id: 'session123',
        title: 'Test Session',
      };

      const mockQrResult = {
        success: false,
        error: 'API Error',
      };

      sessionRepository.findOne.mockResolvedValue(mockSession as Session);
      qrCodeService.generateQrCodeForSession.mockResolvedValue(mockQrResult);

      const result = await controller.generateQrCode('session123');

      expect(result.success).toBe(false);
      expect(result.error).toBe('API Error');
      expect(sessionRepository.update).not.toHaveBeenCalled();
    });
  });

  describe('batchGenerateQrCodes', () => {
    it('should generate QR codes for multiple sessions', async () => {
      const mockSessions = [
        { id: 'session1', title: 'Session 1', isActive: true },
        { id: 'session2', title: 'Session 2', isActive: true },
      ];

      const mockBatchResult = [
        {
          sessionId: 'session1',
          result: { success: true, qrCodeUrl: 'https://qr.com/1.png' },
        },
        {
          sessionId: 'session2',
          result: { success: true, qrCodeUrl: 'https://qr.com/2.png' },
        },
      ];

      sessionRepository.find.mockResolvedValue(mockSessions as Session[]);
      qrCodeService.batchGenerateQrCodes.mockResolvedValue(mockBatchResult);
      sessionRepository.update.mockResolvedValue({} as any);

      const result = await controller.batchGenerateQrCodes({
        session_ids: ['session1', 'session2'],
      });

      expect(result.summary.total).toBe(2);
      expect(result.summary.successful).toBe(2);
      expect(result.summary.failed).toBe(0);
      expect(result.summary.success_rate).toBe(1);
    });

    it('should throw 400 for empty session IDs', async () => {
      await expect(
        controller.batchGenerateQrCodes({ session_ids: [] })
      ).rejects.toThrow(
        new HttpException('No session IDs provided', HttpStatus.BAD_REQUEST)
      );
    });
  });

  describe('getSessionsMissingQrCodes', () => {
    it('should return published sessions without QR codes', async () => {
      const mockSessions = [
        {
          id: '1',
          title: 'Session Without QR',
          status: SessionStatus.PUBLISHED,
          qrCodeUrl: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      sessionRepository.find.mockResolvedValue(mockSessions as Session[]);

      const result = await controller.getSessionsMissingQrCodes();

      expect(result.sessions).toHaveLength(1);
      expect(result.sessions[0].has_qr_code).toBe(false);
      expect(sessionRepository.find).toHaveBeenCalledWith({
        where: {
          status: SessionStatus.PUBLISHED,
          qrCodeUrl: null,
          isActive: true,
        },
        order: { createdAt: 'DESC' },
      });
    });
  });
});